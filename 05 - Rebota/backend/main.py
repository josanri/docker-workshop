
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from redis.asyncio import Redis
import os

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", 6379)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

lua_script = """
local current = tonumber(redis.call("GET", "bubbles") or "0")
local new = current - 1
if new < 0 then
    new = 0
end
redis.call("SET", "bubbles", new)
return new
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.redis = await Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    app.state.redis.register_script(lua_script)
    yield
    await app.state.redis.close()

app.router.lifespan_context = lifespan

@app.get("/")
async def root():
    return {"status": "ok"}

@app.get("/get")
async def get_bubbles():
    redis = app.state.redis
    bubbles = await redis.get("bubbles")
    try:
        bubbles = int(bubbles) if bubbles is not None else 0
    except (TypeError, ValueError):
        bubbles = 0
    return {"bubbles": bubbles}


async def bubble_event_stream(redis_client):
    last_value = None
    while True:
        bubbles = await redis_client.get("bubbles")
        try:
            bubbles = int(bubbles) if bubbles is not None else 0
        except (TypeError, ValueError):
            bubbles = 0
        if bubbles != last_value:
            yield f"data: {bubbles}\n\n"
            last_value = bubbles
        await asyncio.sleep(1)

@app.get("/events")
async def sse_bubbles(request: Request):
    redis_client: Redis = app.state.redis
    async def event_generator():
        async for event in bubble_event_stream(redis_client):
            if await request.is_disconnected():
                break
            yield event
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/increase")
async def increase_bubbles():
    redis: Redis = app.state.redis
    value = await redis.incr("bubbles",)
    extra = {}
    if value == 42:
        extra["title"] = "Congratulations!"
        extra["message"] = "You've reached 42 bubbles!"
    return {"bubbles": value, "extra": extra}


@app.post("/decrease")
async def decrease_bubbles():
    redis: Redis = app.state.redis
    async with redis.pipeline(transaction=True) as pipe:
        while True:
            try:
                await pipe.watch("bubbles")
                bubbles = await redis.get("bubbles")
                bubbles = int(bubbles) if bubbles is not None else 0
                new_value = max(0, bubbles - 1)
                pipe.multi()
                pipe.set("bubbles", new_value)
                await pipe.execute()
                break
            except redis.WatchError:
                continue
    return {"bubbles": new_value}


@app.post("/reset")
async def reset_bubbles():
    redis = app.state.redis
    await redis.set("bubbles", 0)
    return {"bubbles": 0}
