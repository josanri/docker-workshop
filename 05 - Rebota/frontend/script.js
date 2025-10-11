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
    document.addEventListener("click", (event) => {
        incrementParticles();
    });
    document.addEventListener("auxclick", (event) => {
        if (numParticles > 0 && event.button === 1) {
            resetParticles();
        } else if (numParticles >= 0 && event.button === 2) {
            decreaseParticles();
        }
    });
}


// Particle control functions - Update these to interact with your backend
function incrementParticles() {
    numParticles++;
    onUpdateParticles();
}

function decreaseParticles() {
    numParticles--;
    onUpdateParticles();
}

function resetParticles() {
    numParticles = 0;
    onUpdateParticles();
}

function setup() {
    showModal("Finished it", "Congrats")
	createCanvas(window.innerWidth, window.innerHeight);
	colorMode(HSB, 360, 100, 100, 1);
	initializeParticles();
    setEventListeners();
}

