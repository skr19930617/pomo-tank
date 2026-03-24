// @ts-check
/// <reference lib="dom" />

/** @type {ReturnType<typeof acquireVsCodeApi>} */
const vscode = acquireVsCodeApi();

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("tank-canvas");
const ctx = canvas.getContext("2d");

let state = null;
let fishAnimations = [];
let frameCount = 0;

// ── Scene constants (display pixels, canvas = 2x) ──
const S = 2;
const SCENE_W = 220;
const SCENE_H = 180;
const DESK_H = 20;
const LIGHT_H = 8;

canvas.width = SCENE_W * S;
canvas.height = SCENE_H * S;

// Companion tank sizes (display pixels)
const TANK_SIZES = {
  Nano:   { width: 80, height: 60 },
  Small:  { width: 110, height: 82 },
  Medium: { width: 150, height: 112 },
  Large:  { width: 185, height: 138 },
  XL:     { width: 210, height: 150 },
};

const COLORS = {
  waterClean: "#4a90d9",
  tankBg: "#2a5a8a",
  tankBorder: "#1a3a5a",
  sand: "#c8b878",
  sandDark: "#b0a060",
  fishColors: {
    guppy: "#ff9944",
    neon_tetra: "#44ddff",
    corydoras: "#aa8855",
    betta: "#dd4488",
    angelfish: "#eedd44",
  },
  bubble: "#aaddff",
  speechBubble: "#ffffff",
};

const HUNGER_CUE = 50;

function getTankLayout() {
  const tier = state ? state.tank.sizeTier : "Nano";
  const size = TANK_SIZES[tier] || TANK_SIZES.Nano;
  const tw = size.width;
  const th = size.height;
  const deskTop = SCENE_H - DESK_H;
  const tankBottom = deskTop;
  const tankTop = tankBottom - th;
  const tankLeft = (SCENE_W - tw) / 2;
  const lightTop = tankTop - LIGHT_H;
  return {
    tw, th, tankLeft, tankTop, tankBottom, lightTop, deskTop,
    fishXMin: tankLeft + 10,
    fishXMax: tankLeft + tw - 10,
    fishYMin: tankTop + 10,
    fishYMax: tankBottom - 10,
  };
}

function fillRect(x, y, w, h) {
  ctx.fillRect(x * S, y * S, w * S, h * S);
}

function strokeRect(x, y, w, h) {
  ctx.strokeRect(x * S, y * S, w * S, h * S);
}

function initFishAnimation(fish) {
  const l = getTankLayout();
  return {
    id: fish.id,
    x: l.fishXMin + Math.random() * (l.fishXMax - l.fishXMin),
    y: l.fishYMin + Math.random() * (l.fishYMax - l.fishYMin),
    dx: (Math.random() - 0.5) * 0.8,
    dy: (Math.random() - 0.5) * 0.3,
  };
}

function updateFishAnimations() {
  if (!state) return;
  const currentIds = new Set(state.fish.map((f) => f.id));
  fishAnimations = fishAnimations.filter((a) => currentIds.has(a.id));
  for (const fish of state.fish) {
    if (!fishAnimations.find((a) => a.id === fish.id)) {
      fishAnimations.push(initFishAnimation(fish));
    }
  }
  const l = getTankLayout();
  for (const anim of fishAnimations) {
    const fd = state.fish.find((f) => f.id === anim.id);
    if (!fd || fd.healthState === "Dead") continue;
    let sp = fd.healthState === "Sick" ? 0.3 : 1.0;
    if (!state.lightOn) sp *= 0.5;
    anim.x += anim.dx * sp;
    anim.y += anim.dy * sp;
    if (anim.x < l.fishXMin || anim.x > l.fishXMax) {
      anim.dx *= -1;
      anim.x = Math.max(l.fishXMin, Math.min(l.fishXMax, anim.x));
    }
    if (anim.y < l.fishYMin || anim.y > l.fishYMax) {
      anim.dy *= -1;
      anim.y = Math.max(l.fishYMin, Math.min(l.fishYMax, anim.y));
    }
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
  const l = getTankLayout();
  const lightOn = state ? state.lightOn : true;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Wall background
  ctx.fillStyle = "#3a3a4a";
  fillRect(0, 0, SCENE_W, SCENE_H);
  for (let i = 0; i < SCENE_H - DESK_H; i += 4) {
    const t = i / (SCENE_H - DESK_H);
    const v = Math.round(58 + t * 8);
    ctx.fillStyle = `rgb(${v},${v},${v + 16})`;
    fillRect(0, i, SCENE_W, 4);
  }

  // Desk
  ctx.fillStyle = "#8B6914";
  fillRect(0, l.deskTop, SCENE_W, DESK_H);
  ctx.fillStyle = "#7A5C10";
  fillRect(0, l.deskTop + 6, SCENE_W, 1);
  fillRect(0, l.deskTop + 13, SCENE_W, 1);
  ctx.fillStyle = "#A07818";
  fillRect(0, l.deskTop, SCENE_W, 2);
  ctx.fillStyle = "#5A4510";
  fillRect(0, l.deskTop + DESK_H - 2, SCENE_W, 2);

  // Light fixture
  ctx.fillStyle = "#2a2a2a";
  fillRect(l.tankLeft - 2, l.lightTop, l.tw + 4, LIGHT_H);
  ctx.fillStyle = lightOn ? "#e8e0c0" : "#3a3a3a";
  fillRect(l.tankLeft, l.lightTop + 2, l.tw, LIGHT_H - 3);
  if (lightOn) {
    ctx.fillStyle = "#fffbe0";
    fillRect(l.tankLeft + 4, l.lightTop + 3, l.tw - 8, LIGHT_H - 5);
  }

  // Tank frame
  ctx.fillStyle = "#1a3050";
  fillRect(l.tankLeft - 2, l.tankTop - 2, l.tw + 4, l.th + 4);

  // Tank bg
  ctx.fillStyle = COLORS.tankBg;
  fillRect(l.tankLeft, l.tankTop, l.tw, l.th);

  // Water
  if (state) {
    const d = state.tank.waterDirtiness / 100;
    const r = Math.round(42 + d * 65);
    const g = Math.round(144 - d * 80);
    const b = Math.round(217 - d * 160);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
  } else {
    ctx.fillStyle = COLORS.waterClean;
  }
  fillRect(l.tankLeft + 2, l.tankTop + 2, l.tw - 4, l.th - 12);

  // Sand
  ctx.fillStyle = COLORS.sand;
  fillRect(l.tankLeft + 2, l.tankBottom - 10, l.tw - 4, 8);

  // Algae
  if (state && state.tank.algaeLevel > 10) {
    const a = Math.min(state.tank.algaeLevel / 100, 0.6);
    ctx.fillStyle = `rgba(58,122,42,${a})`;
    fillRect(l.tankLeft + 2, l.tankTop + 2, 4, l.th - 12);
    fillRect(l.tankLeft + l.tw - 6, l.tankTop + 2, 4, l.th - 12);
  }

  // Fish
  if (state) {
    for (const anim of fishAnimations) {
      const fd = state.fish.find((f) => f.id === anim.id);
      if (!fd) continue;
      const color = COLORS.fishColors[fd.speciesId] || COLORS.fishColors.guppy;
      let alpha = 1.0;
      let fy = anim.y;
      if (fd.healthState === "Dead") { alpha = 0.4; fy = l.tankTop + 8; }
      else if (fd.healthState === "Sick") { alpha = 0.6; }
      else if (fd.healthState === "Warning") { alpha = 0.8; }

      ctx.globalAlpha = alpha;
      const dir = anim.dx >= 0 ? 1 : -1;
      ctx.fillStyle = color;
      fillRect(anim.x - 6, fy - 4, 12, 8);
      fillRect(anim.x - 6 - dir * 4, fy - 3, 4, 6);
      ctx.fillStyle = "#fff";
      fillRect(anim.x + dir * 3, fy - 2, 2, 2);
      ctx.fillStyle = "#000";
      fillRect(anim.x + dir * 3 + (dir > 0 ? 1 : 0), fy - 2, 1, 1);
      ctx.globalAlpha = 1.0;

      if (fd.healthState !== "Dead" && fd.hungerLevel > HUNGER_CUE && frameCount % 120 < 60) {
        ctx.fillStyle = COLORS.speechBubble;
        ctx.globalAlpha = 0.9;
        fillRect(anim.x - 8, fy - 14, 16, 8);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#333";
        ctx.font = `${6 * S}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("...", anim.x * S, (fy - 8) * S);
      }
    }
  }

  // Tank border
  ctx.strokeStyle = COLORS.tankBorder;
  ctx.lineWidth = 2 * S;
  strokeRect(l.tankLeft, l.tankTop, l.tw, l.th);

  // Dark overlay
  if (!lightOn) {
    ctx.fillStyle = "rgba(0, 0, 20, 0.5)";
    fillRect(l.tankLeft, l.tankTop, l.tw, l.th);
  }

  // Tank shadow on desk
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  fillRect(l.tankLeft + 3, l.deskTop + 2, l.tw, 3);

  frameCount++;
}

function render() {
  updateFishAnimations();
  draw();
  requestAnimationFrame(render);
}

canvas.addEventListener("click", () => {
  vscode.postMessage({ type: "openTank" });
});

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "stateUpdate") {
    state = message.state;
  }
});

vscode.postMessage({ type: "ready" });
render();
