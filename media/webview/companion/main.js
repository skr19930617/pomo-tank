// @ts-check
/// <reference lib="dom" />

/** @type {ReturnType<typeof acquireVsCodeApi>} */
const vscode = acquireVsCodeApi();

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("tank-canvas");
const ctx = canvas.getContext("2d");

// State received from extension host
let state = null;

// Fish animation state
let fishAnimations = [];
let frameCount = 0;

// Colors
const COLORS = {
  waterClean: "#4a90d9",
  waterDirty: "#6b7b3a",
  algaeGreen: "#3a7a2a",
  tankBg: "#2a5a8a",
  tankBorder: "#1a3a5a",
  sand: "#c8b878",
  fishColors: {
    guppy: "#ff9944",
    neon_tetra: "#44ddff",
    corydoras: "#aa8855",
    betta: "#dd4488",
    angelfish: "#eedd44",
  },
  bubble: "#aaddff",
  speechBubble: "#ffffff",
  healthWarning: "#ffaa44",
  healthSick: "#999999",
};

// Health state thresholds for speech bubbles
const HUNGER_CUE_THRESHOLD = 50;
const DIRTINESS_CUE_THRESHOLD = 50;
const ALGAE_CUE_THRESHOLD = 60;

function initFishAnimation(fish) {
  return {
    id: fish.id,
    x: Math.random() * (canvas.width - 20) + 10,
    y: 30 + Math.random() * (canvas.height - 60),
    dx: (Math.random() - 0.5) * 0.8,
    dy: (Math.random() - 0.5) * 0.3,
    size: 12,
    bubbleTimer: 0,
  };
}

function updateFishAnimations() {
  if (!state) return;

  // Sync animation list with current fish
  const currentIds = new Set(state.fish.map((f) => f.id));
  fishAnimations = fishAnimations.filter((a) => currentIds.has(a.id));

  for (const fish of state.fish) {
    if (!fishAnimations.find((a) => a.id === fish.id)) {
      fishAnimations.push(initFishAnimation(fish));
    }
  }

  // Update positions
  for (const anim of fishAnimations) {
    const fishData = state.fish.find((f) => f.id === anim.id);
    if (!fishData || fishData.healthState === "Dead") continue;

    const speedMult = fishData.healthState === "Sick" ? 0.3 : 1.0;

    anim.x += anim.dx * speedMult;
    anim.y += anim.dy * speedMult;

    // Bounce off walls
    if (anim.x < 10 || anim.x > canvas.width - 10) {
      anim.dx *= -1;
      anim.x = Math.max(10, Math.min(canvas.width - 10, anim.x));
    }
    if (anim.y < 25 || anim.y > canvas.height - 25) {
      anim.dy *= -1;
      anim.y = Math.max(25, Math.min(canvas.height - 25, anim.y));
    }

    // Slight random direction change
    if (Math.random() < 0.02) {
      anim.dx += (Math.random() - 0.5) * 0.3;
      anim.dy += (Math.random() - 0.5) * 0.15;
      anim.dx = Math.max(-1, Math.min(1, anim.dx));
      anim.dy = Math.max(-0.5, Math.min(0.5, anim.dy));
    }
  }
}

function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Tank background
  ctx.fillStyle = COLORS.tankBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Water with dirtiness tint
  if (state) {
    const dirtyFactor = state.tank.waterDirtiness / 100;
    const r = Math.round(42 + dirtyFactor * 65);
    const g = Math.round(144 - dirtyFactor * 80);
    const b = Math.round(217 - dirtyFactor * 160);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  } else {
    ctx.fillStyle = COLORS.waterClean;
  }
  ctx.fillRect(2, 15, canvas.width - 4, canvas.height - 25);

  // Sand bottom
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(2, canvas.height - 12, canvas.width - 4, 10);

  // Algae overlay
  if (state && state.tank.algaeLevel > 10) {
    const algaeAlpha = Math.min(state.tank.algaeLevel / 100, 0.6);
    ctx.fillStyle = `rgba(58, 122, 42, ${algaeAlpha})`;
    // Algae on walls
    ctx.fillRect(2, 15, 4, canvas.height - 25);
    ctx.fillRect(canvas.width - 6, 15, 4, canvas.height - 25);
    // Algae on bottom
    ctx.fillRect(2, canvas.height - 15, canvas.width - 4, 3);
  }

  // Draw fish
  if (state) {
    for (const anim of fishAnimations) {
      const fishData = state.fish.find((f) => f.id === anim.id);
      if (!fishData) continue;

      const color =
        COLORS.fishColors[fishData.speciesId] || COLORS.fishColors.guppy;

      // Health state visual modifiers
      let alpha = 1.0;
      let drawY = anim.y;
      if (fishData.healthState === "Dead") {
        alpha = 0.4;
        drawY = 20; // Float to top
      } else if (fishData.healthState === "Sick") {
        alpha = 0.6;
      } else if (fishData.healthState === "Warning") {
        alpha = 0.8;
      }

      ctx.globalAlpha = alpha;

      // Fish body (pixel rectangle for MVP)
      ctx.fillStyle = color;
      const facing = anim.dx >= 0 ? 1 : -1;
      ctx.fillRect(anim.x - 6, drawY - 4, 12, 8);
      // Tail
      ctx.fillRect(
        anim.x - 6 - facing * 4,
        drawY - 3,
        4,
        6,
      );
      // Eye
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(anim.x + facing * 3, drawY - 2, 2, 2);
      ctx.fillStyle = "#000000";
      ctx.fillRect(anim.x + facing * 3 + (facing > 0 ? 1 : 0), drawY - 2, 1, 1);

      ctx.globalAlpha = 1.0;

      // Speech bubbles for care cues
      if (fishData.healthState !== "Dead") {
        const needsCare =
          fishData.hungerLevel > HUNGER_CUE_THRESHOLD ||
          (state.tank.waterDirtiness > DIRTINESS_CUE_THRESHOLD &&
            Math.random() < 0.01) ||
          (state.tank.algaeLevel > ALGAE_CUE_THRESHOLD &&
            Math.random() < 0.01);

        if (
          fishData.hungerLevel > HUNGER_CUE_THRESHOLD &&
          frameCount % 120 < 60
        ) {
          drawSpeechBubble(anim.x, drawY - 12, "...");
        }
      }
    }
  }

  // Tank border
  ctx.strokeStyle = COLORS.tankBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // Ambient bubbles
  if (frameCount % 60 === 0 && Math.random() < 0.3) {
    drawBubble(
      10 + Math.random() * (canvas.width - 20),
      canvas.height - 20,
    );
  }

  frameCount++;
}

function drawSpeechBubble(x, y, text) {
  ctx.fillStyle = COLORS.speechBubble;
  ctx.globalAlpha = 0.9;
  const w = 20;
  const h = 10;
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "#333333";
  ctx.font = "6px monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, x, y - 3);
}

function drawBubble(x, y) {
  ctx.fillStyle = COLORS.bubble;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1.0;
}

function render() {
  updateFishAnimations();
  draw();
  requestAnimationFrame(render);
}

// Click handler - open detailed tank view
canvas.addEventListener("click", () => {
  vscode.postMessage({ type: "openTank" });
});

// Message handler from extension host
window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "stateUpdate") {
    state = message.state;
  }
});

// Signal ready
vscode.postMessage({ type: "ready" });

// Start render loop
render();
