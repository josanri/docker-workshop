/* This code is base on carmenansio CodePen. https://codepen.io/carmenansio/pen/VYZbvxw*/

class Particle {
	constructor() {
		this.pos = createVector(random(width), random(height));
		this.vel = p5.Vector.random2D().mult(random(0.5, 2));
		this.size = random(5, 20);
		this.color = color(random(360), 80, 90);
	}
	update() {
		this.pos.add(this.vel);
		if (this.pos.x < 0 || this.pos.x > width) this.vel.x *= -1;
		if (this.pos.y < 0 || this.pos.y > height) this.vel.y *= -1;
	}
	display() {
		noStroke();
		fill(this.color);
		ellipse(this.pos.x, this.pos.y, this.size);
	}
}

let particles = [];
let numParticles = 0;
const backendURL = "http://localhost:8000";
function initializeParticles() {
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function draw() {
	background(0, 0, 10, 0.1);
	particles.forEach((p) => {
		p.update();
		p.display();
	});
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}

function processResponse(response) {
	response.json().then(data => {
		numParticles = data.bubbles;
		onUpdateParticles();
		if (data.extra && (data.extra.title && data.extra.message)) {
			showModal(data.extra.title, data.extra.message);
		}
	});
}

function showModal(title, msg) {
	let modal = document.getElementById("modal");
	if (!modal) {
		modal = document.createElement("dialog");
		modal.id = "modal";
		modal.innerHTML = `
			<div class="modal-content">
				<h2 id="modal-title"></h2>
				<p id="modal-msg"></p>
                  <form method="dialog">
                      <button id="modal-close">Close</button>
                  </form>
			</div>
		`;
		document.body.appendChild(modal);
		modal.querySelector("#modal-close").onclick = () => modal.close();
	}
	modal.querySelector("#modal-title").textContent = title || "";
	modal.querySelector("#modal-msg").textContent = msg || "";
	modal.showModal();
}

function onUpdateParticles() {
    if (particles.length < numParticles) {
        for (let i = particles.length; i < numParticles; i++)
            particles.push(new Particle());
    } else if (particles.length > numParticles) {
        particles = particles.slice(particles.length - numParticles, particles.length);
    }
}

function setEventListeners() {
    document.addEventListener("click", async (event) => {
        await incrementParticles();
    });
    document.addEventListener("auxclick", async (event) => {
        if (numParticles > 0 && event.button === 1) {
            await resetParticles();
        } else if (numParticles >= 0 && event.button === 2) {
            await decreaseParticles();
        }
    });
}



// Particle control functions - Now interact with backend
async function incrementParticles() {
	const response = await fetch(backendURL + "/increase", { method: "POST" });
	processResponse(response);
}

async function decreaseParticles() {
	const response = await fetch(backendURL + "/decrease", { method: "POST" });
	processResponse(response);
}

async function resetParticles() {
	const response = await fetch(backendURL + "/reset", { method: "POST" });
	processResponse(response);
}


function setup() {
	createCanvas(window.innerWidth, window.innerHeight);
	colorMode(HSB, 360, 100, 100, 1);
	initializeParticles();
	setEventListeners();
	connectSSE();
}

function connectSSE() {
	const sse = new EventSource(backendURL + "/events");
	sse.onmessage = (event) => {
		const bubbles = parseInt(event.data);
		if (!isNaN(bubbles)) {
			numParticles = bubbles;
			onUpdateParticles();
		}
	};
	sse.onerror = () => {
		sse.close();
		setTimeout(connectSSE, 2000); // Try to reconnect after 2s
	};
}

