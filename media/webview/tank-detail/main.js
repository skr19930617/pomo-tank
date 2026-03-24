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

// Tank render sizes matching TankSizeTier → canvas dimensions
const TANK_RENDER_SIZES = {
  Nano:   { width: 200, height: 150 },
  Small:  { width: 260, height: 195 },
  Medium: { width: 320, height: 240 },
  Large:  { width: 370, height: 278 },
  XL:     { width: 400, height: 300 },
};
const DESK_HEIGHT = 30;
const LIGHT_BAR_HEIGHT = 20;

// Colors
const COLORS = {
  waterClean: "#4a90d9",
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
};

const HUNGER_CUE = 50;
const DIRTINESS_CUE = 50;
const ALGAE_CUE = 60;

function resizeCanvas(sizeTier) {
  const size = TANK_RENDER_SIZES[sizeTier] || TANK_RENDER_SIZES.Nano;
  canvas.width = size.width;
  canvas.height = size.height + DESK_HEIGHT + LIGHT_BAR_HEIGHT;
}

function getTankBounds() {
  const size = TANK_RENDER_SIZES[state ? state.tank.sizeTier : "Nano"] || TANK_RENDER_SIZES.Nano;
  return {
    xMin: 20,
    xMax: size.width - 20,
    yMin: LIGHT_BAR_HEIGHT + 20,
    yMax: LIGHT_BAR_HEIGHT + size.height - 20,
    tankTop: LIGHT_BAR_HEIGHT,
    tankBottom: LIGHT_BAR_HEIGHT + size.height,
    tankWidth: size.width,
    tankHeight: size.height,
  };
}

function initFishAnim(fish) {
  const bounds = getTankBounds();
  return {
    id: fish.id,
    x: bounds.xMin + 10 + Math.random() * (bounds.xMax - bounds.xMin - 20),
    y: bounds.yMin + 10 + Math.random() * (bounds.yMax - bounds.yMin - 20),
    dx: (Math.random() - 0.5) * 1.0,
    dy: (Math.random() - 0.5) * 0.4,
    size: 16,
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
  const bounds = getTankBounds();
  for (const a of fishAnimations) {
    const fd = state.fish.find((f) => f.id === a.id);
    if (!fd || fd.healthState === "Dead") continue;
    let sp = fd.healthState === "Sick" ? 0.3 : 1.0;
    if (state && !state.lightOn) sp *= 0.5;
    a.x += a.dx * sp;
    a.y += a.dy * sp;
    if (a.x < bounds.xMin || a.x > bounds.xMax) {
      a.dx *= -1;
      a.x = Math.max(bounds.xMin, Math.min(bounds.xMax, a.x));
    }
    if (a.y < bounds.yMin || a.y > bounds.yMax) {
      a.dy *= -1;
      a.y = Math.max(bounds.yMin, Math.min(bounds.yMax, a.y));
    }
    if (Math.random() < 0.02) {
      a.dx += (Math.random() - 0.5) * 0.3;
      a.dy += (Math.random() - 0.5) * 0.15;
      a.dx = Math.max(-1.2, Math.min(1.2, a.dx));
      a.dy = Math.max(-0.6, Math.min(0.6, a.dy));
    }
  }
}

function draw() {
  if (!ctx) return;
  const bounds = getTankBounds();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Light bar at top
  const lightOn = state ? state.lightOn : true;
  ctx.fillStyle = lightOn ? "#e8e0c0" : "#4a4a4a";
  ctx.fillRect(0, 0, bounds.tankWidth, LIGHT_BAR_HEIGHT);
  // Light bar housing
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 0, bounds.tankWidth, 4);
  ctx.fillRect(0, LIGHT_BAR_HEIGHT - 2, bounds.tankWidth, 2);
  // Light glow indicator
  if (lightOn) {
    ctx.fillStyle = "#fffbe0";
    ctx.fillRect(10, 5, bounds.tankWidth - 20, LIGHT_BAR_HEIGHT - 9);
  }

  // Tank background
  ctx.fillStyle = COLORS.tankBg;
  ctx.fillRect(0, bounds.tankTop, bounds.tankWidth, bounds.tankHeight);

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
  ctx.fillRect(3, bounds.tankTop + 3, bounds.tankWidth - 6, bounds.tankHeight - 18);

  // Sand
  ctx.fillStyle = COLORS.sand;
  ctx.fillRect(3, bounds.tankBottom - 18, bounds.tankWidth - 6, 15);

  // Algae
  if (state && state.tank.algaeLevel > 10) {
    const a = Math.min(state.tank.algaeLevel / 100, 0.6);
    ctx.fillStyle = `rgba(58,122,42,${a})`;
    ctx.fillRect(3, bounds.tankTop + 3, 6, bounds.tankHeight - 18);
    ctx.fillRect(bounds.tankWidth - 9, bounds.tankTop + 3, 6, bounds.tankHeight - 18);
    ctx.fillRect(3, bounds.tankBottom - 22, bounds.tankWidth - 6, 4);
  }

  // Fish
  if (state) {
    for (const anim of fishAnimations) {
      const fd = state.fish.find((f) => f.id === anim.id);
      if (!fd) continue;

      const color = COLORS.fishColors[fd.speciesId] || "#ff9944";
      let alpha = 1.0;
      let dy = anim.y;
      if (fd.healthState === "Dead") { alpha = 0.4; dy = bounds.tankTop + 15; }
      else if (fd.healthState === "Sick") { alpha = 0.6; }
      else if (fd.healthState === "Warning") { alpha = 0.8; }

      ctx.globalAlpha = alpha;
      const dir = anim.dx >= 0 ? 1 : -1;

      // Body
      ctx.fillStyle = color;
      ctx.fillRect(anim.x - 8, dy - 5, 16, 10);
      // Tail
      ctx.fillRect(anim.x - 8 - dir * 5, dy - 4, 5, 8);
      // Eye
      ctx.fillStyle = "#fff";
      ctx.fillRect(anim.x + dir * 4, dy - 3, 3, 3);
      ctx.fillStyle = "#000";
      ctx.fillRect(anim.x + dir * 5, dy - 3, 1, 1);

      ctx.globalAlpha = 1.0;

      // Speech bubble
      if (fd.healthState !== "Dead" && fd.hungerLevel > HUNGER_CUE && frameCount % 120 < 60) {
        ctx.fillStyle = COLORS.speechBubble;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(anim.x - 12, dy - 18, 24, 12);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "#333";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("...", anim.x, dy - 9);
      }
    }
  }

  // Tank border
  ctx.strokeStyle = COLORS.tankBorder;
  ctx.lineWidth = 3;
  ctx.strokeRect(1, bounds.tankTop, bounds.tankWidth - 2, bounds.tankHeight);

  // Dark overlay when light is off
  if (!lightOn) {
    ctx.fillStyle = "rgba(0, 0, 20, 0.5)";
    ctx.fillRect(0, bounds.tankTop, bounds.tankWidth, bounds.tankHeight);
  }

  // Desk below tank
  const deskTop = bounds.tankBottom;
  // Desk surface (main wood color)
  ctx.fillStyle = "#8B6914";
  ctx.fillRect(0, deskTop, bounds.tankWidth, DESK_HEIGHT);
  // Wood grain lines
  ctx.fillStyle = "#7A5C10";
  ctx.fillRect(0, deskTop + 8, bounds.tankWidth, 2);
  ctx.fillRect(0, deskTop + 18, bounds.tankWidth, 2);
  // Desk edge highlight
  ctx.fillStyle = "#A07818";
  ctx.fillRect(0, deskTop, bounds.tankWidth, 3);
  // Desk bottom shadow
  ctx.fillStyle = "#5A4510";
  ctx.fillRect(0, deskTop + DESK_HEIGHT - 3, bounds.tankWidth, 3);

  frameCount++;
}

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
  const panel = document.getElementById("store-panel");
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

// Button handlers
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

// Message handler
window.addEventListener("message", (event) => {
  const msg = event.data;
  switch (msg.type) {
    case "stateUpdate":
      state = msg.state;
      resizeCanvas(state.tank.sizeTier);
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

// Initial canvas size (Nano default, will be updated on first stateUpdate)
resizeCanvas("Nano");

vscode.postMessage({ type: "ready" });
render();
