const config = {
    pixelSizeMin: 8,
    pixelSizeMax: 12,
    maxPixels: 30,
    goal: 50,
    fallSpeedMin: 1.5,
    fallSpeedMax: 3,
    swayMin: 0.5,
    swayMax: 2,
    rotationMin: -2,
    rotationMax: 2,
    playerWidth: 140,
    playerHeight: 12,
    playerSpeed: 12,
    targetFPS: 60,

    colors: [
        "#00c8c8",
        "#008a8a",
        "#0a3a4a",
        "#7b3fbe"
    ]
};

const game = {
    running: false,
    finished: false,
    score: 0,
    pixels: [],
    animationId: null,
    lastFrame: 0,

    keys: {
        left: false,
        right: false,
    }
};

const elements = {
    body: null,
    gameSection: null,
    gameArea: null,
    playerBar: null,
    gameTitle: null,
    rainLayer: null,
};

document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
    cacheElements();
    createRainLayer();
    configurePlayer();
    startGame();
}

function cacheElements() {
    elements.body = document.body;
    elements.gameSection = document.querySelector("#data-pixel-game");
    elements.gameArea = document.querySelector(".game-area");
    elements.playerBar = document.querySelector("#player-bar");
    elements.gameTitle = document.querySelector("#game-title");
    elements.gameTitle.dataset.defaultText = elements.gameTitle.textContent.trim();
}

function createRainLayer() {
    const layer = document.createElement("div");
    layer.id = "pixel-rain-layer";
    elements.body.appendChild(layer);
    elements.rainLayer = layer;
}

function configurePlayer() {
    elements.playerBar.style.width = config.playerWidth + "px";
    // remove o transform:translateX(-50%) do CSS inicial, pois a partir
    // de agora a posição é controlada 100% via style.left em px pelo JS
    elements.playerBar.style.transform = "none";
    centerPlayer();
}

function startGame() {
    game.running = true;
    game.finished = false;
    game.score = 0;
    game.lastFrame = performance.now();
    game.animationId = requestAnimationFrame(gameLoop);
}

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max));
}

function randomColor() {
    return config.colors[randomInt(0, config.colors.length)];
}

function spawnPixel() {
    if (game.pixels.length >= config.maxPixels) return;

    const pixel = document.createElement("div");
    pixel.className = "data-pixel";

    const size = random(config.pixelSizeMin, config.pixelSizeMax);
    const color = randomColor();
    const x = random(0, window.innerWidth - size);
    const y = -30;

    const speed = random(config.fallSpeedMin, config.fallSpeedMax);
    const sway = random(config.swayMin, config.swayMax);
    const direction = Math.random() < 0.5 ? -1 : 1;
    const rotation = random(config.rotationMin, config.rotationMax);
    const angle = random(0, Math.PI * 2);

    pixel.style.width = size + "px";
    pixel.style.height = size + "px";
    pixel.style.background = color;
    pixel.style.boxShadow = `0 0 8px ${color}`;
    pixel.style.left = x + "px";
    pixel.style.top = y + "px";
    pixel.style.transform = `rotate(${rotation}deg)`;

    elements.rainLayer.appendChild(pixel);

    game.pixels.push({
        element: pixel,
        x,
        y,
        size,
        speed,
        sway,
        direction,
        angle,
        rotation,
        collected: false
    });
}

function updatePixels() {
    for (let i = game.pixels.length - 1; i >= 0; i--) {
        const pixel = game.pixels[i];
        movePixel(pixel);
        updatePixelElement(pixel);
        removePixel(pixel, i);
    }
}

function movePixel(pixel) {
    // Queda
    pixel.y += pixel.speed;

    // Oscilação horizontal
    pixel.angle += 0.03;
    pixel.x += Math.sin(pixel.angle) * pixel.sway;

    // Rotação suave
    pixel.rotation += 0.5;
}

function updatePixelElement(pixel) {
    pixel.element.style.transform =
        `translate(${pixel.x}px, ${pixel.y}px) rotate(${pixel.rotation}deg)`;
}

function removePixel(pixel, index) {
    if (pixel.y <= window.innerHeight + 50) return;

    pixel.element.remove();
    game.pixels.splice(index, 1);
}

function maintainPixelPopulation() {
    while (game.pixels.length < config.maxPixels) {
        spawnPixel();
    }
}

/* Remove TODOS os Data Pixels. */
function clearPixels() {
    game.pixels.forEach(pixel => {
        pixel.element.remove();
    });
    game.pixels = [];
}

/* Fade-out dos Data Pixels. */
function fadePixels() {
    game.pixels.forEach(pixel => {
        pixel.element.style.transition = "opacity .4s ease";
        pixel.element.style.opacity = "0";
    });
}

function stopRain() {
    game.running = false;
}

function movePlayer() {
    const player = elements.playerBar;
    let position = player.offsetLeft;

    if (game.keys.left) {
        position -= config.playerSpeed;
    }
    if (game.keys.right) {
        position += config.playerSpeed;
    }

    player.style.left = position + "px";
    limitPlayer();
}

function limitPlayer() {
    const player = elements.playerBar;
    let left = player.offsetLeft;

    if (left < 0) {
        left = 0;
    }
    if (left + player.offsetWidth > elements.gameArea.clientWidth) {
        left = elements.gameArea.clientWidth - player.offsetWidth;
    }

    player.style.left = left + "px";
}

function centerPlayer() {
    const position = (elements.gameArea.clientWidth / 2) - (config.playerWidth / 2);
    elements.playerBar.style.left = position + "px";
}

function checkCollisions() {
    const playerRect = elements.playerBar.getBoundingClientRect();

    for (let i = game.pixels.length - 1; i >= 0; i--) {
        const pixel = game.pixels[i];
        if (pixel.collected) continue;

        if (isColliding(pixel, playerRect)) {
            collectPixel(pixel, i);
        }
    }
}

function isColliding(pixel, playerRect) {
    const pixelRect = pixel.element.getBoundingClientRect();

    return !(
        pixelRect.right < playerRect.left ||
        pixelRect.left > playerRect.right ||
        pixelRect.bottom < playerRect.top ||
        pixelRect.top > playerRect.bottom
    );
}

function collectPixel(pixel, index) {
    pixel.collected = true;
    pixel.element.remove();
    game.pixels.splice(index, 1);
    increaseScore();
}

function increaseScore() {
    game.score++;
    if (game.score >= config.goal) {
        finishGame();
    }
}

function getScore() {
    return game.score;
}

function hasWon() {
    return game.score >= config.goal;
}

function gameLoop(currentTime) {
    if (!game.running) return;

    const deltaTime = currentTime - game.lastFrame;
    game.lastFrame = currentTime;

    movePlayer();
    maintainPixelPopulation();
    updatePixels();
    checkCollisions();

    game.animationId = requestAnimationFrame(gameLoop);
}

function finishGame() {
    if (game.finished) return;

    game.finished = true;
    game.running = false;

    cancelAnimationFrame(game.animationId);

    stopRain();
    fadePixels();
    glowPlayerBar();

    setTimeout(() => {
        clearPixels();
        showVictoryMessage();
    }, 500);
}

function glowPlayerBar() {
    elements.playerBar.classList.add("winner");
}

function showVictoryMessage() {
    elements.gameTitle.textContent = "🎉 Você coletou todos os Data Pixels !!!";
    elements.gameTitle.classList.add("completed");
}

function resetGame() {
    game.score = 0;
    game.finished = false;
    game.running = true;

    elements.gameTitle.textContent = elements.gameTitle.dataset.defaultText;
    elements.gameTitle.classList.remove("completed");
    elements.playerBar.classList.remove("winner");

    clearPixels();

    game.animationId = requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
    switch (event.key) {
        case "ArrowLeft":
            game.keys.left = true;
            break;
        case "ArrowRight":
            game.keys.right = true;
            break;
    }
});

window.addEventListener("keyup", (event) => {
    switch (event.key) {
        case "ArrowLeft":
            game.keys.left = false;
            break;
        case "ArrowRight":
            game.keys.right = false;
            break;
    }
});

window.addEventListener("resize", () => {
    if (!elements.playerBar || !elements.gameArea) return;

    const maxX = elements.gameArea.clientWidth - elements.playerBar.offsetWidth;
    const current = elements.playerBar.offsetLeft;

    if (current > maxX) {
        elements.playerBar.style.left = maxX + "px";
    }
});

window.addEventListener("blur", () => {
    game.keys.left = false;
    game.keys.right = false;
});

window.addEventListener("focus", () => {
    game.keys.left = false;
    game.keys.right = false;
});