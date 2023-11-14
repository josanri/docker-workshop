const express = require('express');
const router = express.Router();
const redis = require("redis");
const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute:'numeric' };
const redisHost = (process.env.REDIS_HOST === undefined)? `redis://localhost:6379` : `redis://${process.env.REDIS_HOST}:6379`;
redisClient = redis.createClient({
    url: redisHost,
})


process.on('SIGINT', () => {
  redisClient.quit();
  process.exit();
});

/* GET home page. */
router.get('/', async (req, res, next) => {
  await redisClient.connect();
  const visits = await redisClient.get("visits");
  let numVisits = 0;
  if (visits !== null) {
    numVisits = parseInt(visits, 10);
  }
  const lastVisitTimestamp = await redisClient.get("lastVisitTimestamp");
  let formattedDate;
  if (lastVisitTimestamp !== null) {
    formattedDate = new Date(0);
    formattedDate.setUTCSeconds(parseInt(lastVisitTimestamp));
    formattedDate = formattedDate.toLocaleDateString("es-ES", dateOptions);
  }
  res.render('index', {
    title: 'The End',
    visits: numVisits + 1,
    lastVisitTimestamp: formattedDate
  });
  await redisClient.set("lastVisitTimestamp", Date.now() / 1000);
  if (visits === null) {
    await redisClient.set("visits", "1");
  } else {
    await redisClient.incr("visits");
  }
  await redisClient.disconnect();
});

module.exports = router;