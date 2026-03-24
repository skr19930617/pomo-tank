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
let storeOpen = false;

// ── Scene constants (in display pixels, canvas = 2x) ──
const S = 2; // pixel scale factor
const SCENE_W = 480;
const SCENE_H = 380;
const DESK_H = 40;
const LIGHT_H = 16;
const WALL_SHELF_Y = 60; // decorative shelf line on the wall

// Canvas is always fixed at 2x scene size
canvas.width = SCENE_W * S;
canvas.height = SCENE_H * S;

// Tank render sizes (display pixels) — tank glass area only
const TANK_SIZES = {
  Nano:   { width: 160, height: 120 },
  Small:  { width: 220, height: 165 },
  Medium: { width: 300, height: 225 },
  Large:  { width: 380, height: 285 },
  XL:     { width: 440, height: 310 },
};

// Colors
const COLORS = {
  waterClean: "#4a90d9",
  tankBg: "#2a5a8a",
  tankBorder: "#1a3a5a",
  tankBorderLight: "#2a5070",
  sand: "#c8b878",
  sandDark: "#b0a060",
  wallTop: "#3a3a4a",
  wallBottom: "#2e2e3a",
  wallAccent: "#44445a",
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

// ── Layout helpers ──

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
    // Fish swim bounds (in display coords)
    fishXMin: tankLeft + 16,
    fishXMax: tankLeft + tw - 16,
    fishYMin: tankTop + 16,
    fishYMax: tankBottom - 16,
  };
}

// ── Fish animation ──

function initFishAnim(fish) {
  const l = getTankLayout();
  return {
    id: fish.id,
    x: l.fishXMin + 8 + Math.random() * (l.fishXMax - l.fishXMin - 16),
    y: l.fishYMin + 8 + Math.random() * (l.fishYMax - l.fishYMin - 16),
    dx: (Math.random() - 0.5) * 1.2,
    dy: (Math.random() - 0.5) * 0.5,
  };
}

function updateAnimations() {
  if (!state) return;
  const ids = new Set(state.fish.map((f) => f.id));
  fishAnimations = fishAnimations.filter((a) => ids.has(a.id));
  for (const fish of state.fish) {
    if (!fishAnimations.find((a) => a.id === fish.id)) {
      fishAnimations.push(initFishAnim(fish));
    }
  }
  const l = getTankLayout();
  for (const a of fishAnimations) {
    const fd = state.fish.find((f) => f.id === a.id);
    if (!fd || fd.healthState === "Dead") continue;
    let sp = fd.healthState === "Sick" ? 0.3 : 1.0;
    if (!state.lightOn) sp *= 0.5;
    a.x += a.dx * sp;
    a.y += a.dy * sp;
    if (a.x < l.fishXMin || a.x > l.fishXMax) {
      a.dx *= -1;
      a.x = Math.max(l.fishXMin, Math.min(l.fishXMax, a.x));
    }
    if (a.y < l.fishYMin || a.y > l.fishYMax) {
      a.dy *= -1;
      a.y = Math.max(l.fishYMin, Math.min(l.fishYMax, a.y));
    }
    if (Math.random() < 0.02) {
      a.dx += (Math.random() - 0.5) * 0.3;
      a.dy += (Math.random() - 0.5) * 0.15;
      a.dx = Math.max(-1.4, Math.min(1.4, a.dx));
      a.dy = Math.max(-0.7, Math.min(0.7, a.dy));
    }
  }
}

// ── Drawing helpers (all coords in display pixels, drawn at S×) ──

function fillRect(x, y, w, h) {
  ctx.fillRect(x * S, y * S, w * S, h * S);
}

function strokeRect(x, y, w, h) {
  ctx.strokeRect(x * S, y * S, w * S, h * S);
}

// ── Main draw ──

function draw() {
  if (!ctx) return;
  const l = getTankLayout();
  const lightOn = state ? state.lightOn : true;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ── Wall background (gradient-like with horizontal stripes) ──
  // Base wall
  ctx.fillStyle = COLORS.wallTop;
  fillRect(0, 0, SCENE_W, SCENE_H);
  // Subtle gradient via stripes
  for (let i = 0; i < SCENE_H - DESK_H; i += 4) {
    const t = i / (SCENE_H - DESK_H);
    const r = Math.round(58 + t * 8);
    const g = Math.round(58 + t * 8);
    const b = Math.round(74 + t * 8);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    fillRect(0, i, SCENE_W, 4);
  }
  // Wall decorative elements — horizontal shelf line
  ctx.fillStyle = "#50506a";
  fillRect(0, WALL_SHELF_Y, SCENE_W, 3);
  ctx.fillStyle = "#3a3a50";
  fillRect(0, WALL_SHELF_Y + 3, SCENE_W, 1);

  // ── Desk (full width) ──
  // Main surface
  ctx.fillStyle = "#8B6914";
  fillRect(0, l.deskTop, SCENE_W, DESK_H);
  // Wood grain
  ctx.fillStyle = "#7A5C10";
  fillRect(0, l.deskTop + 10, SCENE_W, 2);
  fillRect(0, l.deskTop + 22, SCENE_W, 2);
  fillRect(0, l.deskTop + 32, SCENE_W, 2);
  // Top edge highlight
  ctx.fillStyle = "#A07818";
  fillRect(0, l.deskTop, SCENE_W, 4);
  // Front edge shadow
  ctx.fillStyle = "#5A4510";
  fillRect(0, l.deskTop + DESK_H - 4, SCENE_W, 4);

  // ── Light fixture (above tank, centered) ──
  // Housing
  ctx.fillStyle = "#2a2a2a";
  fillRect(l.tankLeft - 4, l.lightTop, l.tw + 8, LIGHT_H);
  // Light surface
  ctx.fillStyle = lightOn ? "#e8e0c0" : "#3a3a3a";
  fillRect(l.tankLeft, l.lightTop + 3, l.tw, LIGHT_H - 5);
  // Glow
  if (lightOn) {
    ctx.fillStyle = "#fffbe0";
    fillRect(l.tankLeft + 8, l.lightTop + 5, l.tw - 16, LIGHT_H - 8);
    // Light glow on wall above
    ctx.fillStyle = "rgba(255,250,200,0.08)";
    fillRect(l.tankLeft - 20, l.lightTop - 40, l.tw + 40, 40);
  }

  // ── Tank glass ──
  // Tank frame (slightly larger than glass)
  ctx.fillStyle = "#1a3050";
  fillRect(l.tankLeft - 3, l.tankTop - 3, l.tw + 6, l.th + 6);

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
  fillRect(l.tankLeft + 4, l.tankTop + 4, l.tw - 8, l.th - 20);

  // Sand layers
  ctx.fillStyle = COLORS.sandDark;
  fillRect(l.tankLeft + 4, l.tankBottom - 20, l.tw - 8, 4);
  ctx.fillStyle = COLORS.sand;
  fillRect(l.tankLeft + 4, l.tankBottom - 16, l.tw - 8, 12);
  // Sand gravel detail
  ctx.fillStyle = "#d4c888";
  for (let gx = l.tankLeft + 8; gx < l.tankLeft + l.tw - 8; gx += 12) {
    fillRect(gx, l.tankBottom - 14, 4, 2);
  }

  // Algae
  if (state && state.tank.algaeLevel > 10) {
    const a = Math.min(state.tank.algaeLevel / 100, 0.6);
    ctx.fillStyle = `rgba(58,122,42,${a})`;
    fillRect(l.tankLeft + 4, l.tankTop + 4, 8, l.th - 20);
    fillRect(l.tankLeft + l.tw - 12, l.tankTop + 4, 8, l.th - 20);
    fillRect(l.tankLeft + 4, l.tankBottom - 24, l.tw - 8, 4);
  }

  // Water surface shimmer
  if (lightOn) {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    fillRect(l.tankLeft + 6, l.tankTop + 4, l.tw - 12, 3);
  }

  // ── Fish ──
  if (state) {
    for (const anim of fishAnimations) {
      const fd = state.fish.find((f) => f.id === anim.id);
      if (!fd) continue;

      const color = COLORS.fishColors[fd.speciesId] || "#ff9944";
      let alpha = 1.0;
      let fy = anim.y;
      if (fd.healthState === "Dead") { alpha = 0.4; fy = l.tankTop + 20; }
      else if (fd.healthState === "Sick") { alpha = 0.6; }
      else if (fd.healthState === "Warning") { alpha = 0.8; }

      ctx.globalAlpha = alpha;
      const dir = anim.dx >= 0 ? 1 : -1;

      // Body (larger at 2x)
      ctx.fillStyle = color;
      fillRect(anim.x - 10, fy - 6, 20, 12);
      // Tail
      fillRect(anim.x - 10 - dir * 7, fy - 5, 7, 10);
      // Dorsal fin
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.7;
      fillRect(anim.x - 2, fy - 9, 8, 4);
      ctx.globalAlpha = alpha;
      // Belly highlight
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = alpha * 0.2;
      fillRect(anim.x - 8, fy + 2, 16, 3);
      ctx.globalAlpha = alpha;
      // Eye
      ctx.fillStyle = "#fff";
      fillRect(anim.x + dir * 5, fy - 4, 4, 4);
      ctx.fillStyle = "#000";
      fillRect(anim.x + dir * 6, fy - 3, 2, 2);

      ctx.globalAlpha = 1.0;

      // Speech bubble
      if (fd.healthState !== "Dead" && fd.hungerLevel > HUNGER_CUE && frameCount % 120 < 60) {
        ctx.fillStyle = COLORS.speechBubble;
        ctx.globalAlpha = 0.9;
        fillRect(anim.x - 14, fy - 22, 28, 14);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#333";
        ctx.font = `${10 * S}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("...", anim.x * S, (fy - 11) * S);
      }
    }
  }

  // ── Ambient bubbles ──
  if (lightOn && state) {
    if (frameCount % 90 === 0 && Math.random() < 0.3) {
      const bx = l.fishXMin + Math.random() * (l.fishXMax - l.fishXMin);
      ctx.fillStyle = COLORS.bubble;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(bx * S, (l.tankBottom - 24) * S, 3 * S, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  // ── Tank border (glass edge) ──
  ctx.strokeStyle = COLORS.tankBorder;
  ctx.lineWidth = 4 * S;
  strokeRect(l.tankLeft, l.tankTop, l.tw, l.th);
  // Glass highlight on left edge
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  fillRect(l.tankLeft + 4, l.tankTop + 4, 4, l.th - 8);

  // ── Dark overlay when light is off ──
  if (!lightOn) {
    ctx.fillStyle = "rgba(0, 0, 20, 0.5)";
    fillRect(l.tankLeft, l.tankTop, l.tw, l.th);
  }

  // ── Tank shadow on desk ──
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  fillRect(l.tankLeft + 6, l.deskTop + 4, l.tw, 6);

  frameCount++;
}

// ── Stats & UI ──

function updateStats() {
  if (!state) return;
  const living = state.fish.filter((f) => f.healthState !== "Dead");
  const avgHunger = living.length > 0
    ? living.reduce((s, f) => s + f.hungerLevel, 0) / living.length
    : 0;
  const timeMins = Math.floor(state.session.timeSinceLastMaintenance / 60000);

  document.getElementById("stat-hunger").textContent = `Hunger: ${Math.round(avgHunger)}%`;
  document.getElementById("stat-water").textContent = `Water: ${Math.round(state.tank.waterDirtiness)}%`;
  document.getElementById("stat-algae").textContent = `Algae: ${Math.round(state.tank.algaeLevel)}%`;
  document.getElementById("stat-pomo").textContent = `Pomo: ${state.player.pomoBalance}`;
  document.getElementById("stat-streak").textContent = `Streak: ${state.player.currentStreak}`;
  document.getElementById("stat-timer").textContent = state.lightOn
    ? `Session: ${timeMins}min`
    : `Session: ${timeMins}min (paused)`;
  document.getElementById("btn-light").textContent = state.lightOn ? "Light: ON" : "Light: OFF";
}

function renderStore() {
  const container = document.getElementById("store-items");
  if (!state || !state.store) return;

  container.innerHTML = "";

  const groups = { TankUpgrade: "Tanks", Filter: "Filters", FishSpecies: "Fish" };
  for (const [type, label] of Object.entries(groups)) {
    const items = state.store.items.filter((i) => i.type === type);
    if (items.length === 0) continue;

    const cat = document.createElement("div");
    cat.className = "store-category";
    cat.innerHTML = `<h4>${label}</h4>`;

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "store-item";
      const canBuy = item.affordable && item.meetsPrerequisites;
      row.innerHTML = `
        <div class="store-item-info">
          <div class="store-item-name">${item.name}</div>
        </div>
        <span class="store-item-cost">${item.pomoCost}p</span>
        <button class="store-item-btn" ${canBuy ? "" : "disabled"}>${canBuy ? "Buy" : "Locked"}</button>
      `;
      const btn = row.querySelector("button");
      if (canBuy) {
        btn.addEventListener("click", () => {
          vscode.postMessage({ type: "purchaseItem", itemId: item.id });
        });
      }
      cat.appendChild(row);
    }
    container.appendChild(cat);
  }
}

function showNotification(text) {
  const el = document.getElementById("notification");
  el.textContent = text;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2000);
}

function render() {
  updateAnimations();
  draw();
  requestAnimationFrame(render);
}

// ── Button handlers ──
document.getElementById("btn-feed").addEventListener("click", () => {
  vscode.postMessage({ type: "feedFish" });
});
document.getElementById("btn-water").addEventListener("click", () => {
  vscode.postMessage({ type: "changeWater" });
});
document.getElementById("btn-algae").addEventListener("click", () => {
  vscode.postMessage({ type: "cleanAlgae" });
});
document.getElementById("btn-light").addEventListener("click", () => {
  vscode.postMessage({ type: "toggleLight" });
});
document.getElementById("btn-store").addEventListener("click", () => {
  storeOpen = !storeOpen;
  const panel = document.getElementById("store-panel");
  if (storeOpen) {
    panel.classList.remove("hidden");
    renderStore();
  } else {
    panel.classList.add("hidden");
  }
});

// ── Message handler ──
window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "stateUpdate":
      state = msg.state;
      updateStats();
      if (storeOpen) renderStore();
      break;
    case "lightToggleResult":
      if (msg.success && state) {
        state.lightOn = msg.lightOn;
      }
      break;
    case "actionResult":
      if (msg.success) {
        showNotification(`${msg.action} done!`);
      }
      break;
    case "pointsAwarded":
      showNotification(`+${msg.points} pomo ${msg.bonus}`);
      break;
    case "purchaseResult":
      if (msg.success) {
        showNotification("Purchased!");
      } else {
        showNotification(msg.message || "Cannot purchase");
      }
      break;
  }
});

vscode.postMessage({ type: "ready" });
render();
