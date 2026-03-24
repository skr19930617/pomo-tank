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

// Companion render sizes (scaled ~0.5 of main)
const COMPANION_RENDER_SIZES = {
  Nano:   { width: 100, height: 75 },
  Small:  { width: 130, height: 98 },
  Medium: { width: 160, height: 120 },
  Large:  { width: 185, height: 139 },
  XL:     { width: 200, height: 150 },
};
const COMPANION_DESK_HEIGHT = 15;
const COMPANION_LIGHT_BAR_HEIGHT = 10;

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

function resizeCompanionCanvas(sizeTier) {
  const size = COMPANION_RENDER_SIZES[sizeTier] || COMPANION_RENDER_SIZES.Nano;
  canvas.width = size.width;
  canvas.height = size.height + COMPANION_DESK_HEIGHT + COMPANION_LIGHT_BAR_HEIGHT;
}

function getCompanionBounds() {
  const size = COMPANION_RENDER_SIZES[state ? state.tank.sizeTier : "Nano"] || COMPANION_RENDER_SIZES.Nano;
  return {
    xMin: 10,
    xMax: size.width - 10,
    yMin: COMPANION_LIGHT_BAR_HEIGHT + 15,
    yMax: COMPANION_LIGHT_BAR_HEIGHT + size.height - 15,
    tankTop: COMPANION_LIGHT_BAR_HEIGHT,
    tankBottom: COMPANION_LIGHT_BAR_HEIGHT + size.height,
    tankWidth: size.width,
    tankHeight: size.height,
  };
}

function initFishAnimation(fish) {
  const bounds = getCompanionBounds();
  return {
    id: fish.id,
    x: bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin),
    y: bounds.yMin + Math.random() * (bounds.yMax - bounds.yMin),
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
  const bounds = getCompanionBounds();
  for (const anim of fishAnimations) {
    const fishData = state.fish.find((f) => f.id === anim.id);
    if (!fishData || fishData.healthState === "Dead") continue;

    let speedMult = fishData.healthState === "Sick" ? 0.3 : 1.0;
    if (state && !state.lightOn) speedMult *= 0.5;

    anim.x += anim.dx * speedMult;
    anim.y += anim.dy * speedMult;

    // Bounce off walls
    if (anim.x < bounds.xMin || anim.x > bounds.xMax) {
      anim.dx *= -1;
      anim.x = Math.max(bounds.xMin, Math.min(bounds.xMax, anim.x));
    }
    if (anim.y < bounds.yMin || anim.y > bounds.yMax) {
      anim.dy *= -1;
      anim.y = Math.max(bounds.yMin, Math.min(bounds.yMax, anim.y));
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
  const bounds = getCompanionBounds();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Light bar at top
  const lightOn = state ? state.lightOn : true;
  ctx.fillStyle = lightOn ? "#e8e0c0" : "#4a4a4a";
  ctx.fillRect(0, 0, bounds.tankWidth, COMPANION_LIGHT_BAR_HEIGHT);
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 0, bounds.tankWidth, 2);
  ctx.fillRect(0, COMPANION_LIGHT_BAR_HEIGHT - 1, bounds.tankWidth, 1);
  if (lightOn) {
    ctx.fillStyle = "#fffbe0";
    ctx.fillRect(5, 3, bounds.tankWidth - 10, COMPANION_LIGHT_BAR_HEIGHT - 5);
  }

  // Tank background
  ctx.fillStyle = COLORS.tankBg;
  ctx.fillRect(0, bounds.tankTop, bounds.tankWidth, bounds.tankHeight);

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
  ctx.fillRect(2, bounds.tankTop + 2, bounds.tankWidth - 4, bounds.tankHeight - 14);

  // Sand bottom
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(2, bounds.tankBottom - 12, bounds.tankWidth - 4, 10);

  // Algae overlay
  if (state && state.tank.algaeLevel > 10) {
    const algaeAlpha = Math.min(state.tank.algaeLevel / 100, 0.6);
    ctx.fillStyle = `rgba(58, 122, 42, ${algaeAlpha})`;
    ctx.fillRect(2, bounds.tankTop + 2, 4, bounds.tankHeight - 14);
    ctx.fillRect(bounds.tankWidth - 6, bounds.tankTop + 2, 4, bounds.tankHeight - 14);
    ctx.fillRect(2, bounds.tankBottom - 15, bounds.tankWidth - 4, 3);
  }

  // Draw fish
  if (state) {
    for (const anim of fishAnimations) {
      const fishData = state.fish.find((f) => f.id === anim.id);
      if (!fishData) continue;

      const color =
        COLORS.fishColors[fishData.speciesId] || COLORS.fishColors.guppy;

      let alpha = 1.0;
      let drawY = anim.y;
      if (fishData.healthState === "Dead") {
        alpha = 0.4;
        drawY = bounds.tankTop + 10;
      } else if (fishData.healthState === "Sick") {
        alpha = 0.6;
      } else if (fishData.healthState === "Warning") {
        alpha = 0.8;
      }

      ctx.globalAlpha = alpha;

      ctx.fillStyle = color;
      const facing = anim.dx >= 0 ? 1 : -1;
      ctx.fillRect(anim.x - 6, drawY - 4, 12, 8);
      ctx.fillRect(anim.x - 6 - facing * 4, drawY - 3, 4, 6);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(anim.x + facing * 3, drawY - 2, 2, 2);
      ctx.fillStyle = "#000000";
      ctx.fillRect(anim.x + facing * 3 + (facing > 0 ? 1 : 0), drawY - 2, 1, 1);

      ctx.globalAlpha = 1.0;

      if (fishData.healthState !== "Dead" &&
          fishData.hungerLevel > HUNGER_CUE_THRESHOLD &&
          frameCount % 120 < 60) {
        drawSpeechBubble(anim.x, drawY - 12, "...");
      }
    }
  }

  // Tank border
  ctx.strokeStyle = COLORS.tankBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, bounds.tankTop, bounds.tankWidth - 2, bounds.tankHeight);

  // Dark overlay when light is off
  if (!lightOn) {
    ctx.fillStyle = "rgba(0, 0, 20, 0.5)";
    ctx.fillRect(0, bounds.tankTop, bounds.tankWidth, bounds.tankHeight);
  }

  // Desk below tank
  const deskTop = bounds.tankBottom;
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(0, deskTop, bounds.tankWidth, COMPANION_DESK_HEIGHT);
  ctx.fillStyle = "#7A5C10";
  ctx.fillRect(0, deskTop + 4, bounds.tankWidth, 1);
  ctx.fillRect(0, deskTop + 9, bounds.tankWidth, 1);
  ctx.fillStyle = "#A07818";
  ctx.fillRect(0, deskTop, bounds.tankWidth, 2);
  ctx.fillStyle = "#5A4510";
  ctx.fillRect(0, deskTop + COMPANION_DESK_HEIGHT - 2, bounds.tankWidth, 2);

  // Ambient bubbles
  if (lightOn && frameCount % 60 === 0 && Math.random() < 0.3) {
    drawBubble(
      bounds.xMin + Math.random() * (bounds.xMax - bounds.xMin),
      bounds.tankBottom - 15,
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
    resizeCompanionCanvas(state.tank.sizeTier);
  }
});

// Initial canvas size (Nano default)
resizeCompanionCanvas("Nano");

// Signal ready
vscode.postMessage({ type: "ready" });

// Start render loop
render();
