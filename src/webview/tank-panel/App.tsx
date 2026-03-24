import React, { useState, useMemo } from "react";
import { useGameState } from "./hooks/useGameState";
import { useFishAnimation } from "./hooks/useFishAnimation";
import type { FishBounds } from "./hooks/useFishAnimation";
import { TankScene } from "./components/TankScene";
import { StatsBar } from "./components/StatsBar";
import { Actions } from "./components/Actions";
import { Store } from "./components/Store";
import {
  TANK_RENDER_SIZES,
  DESK_HEIGHT,
  LIGHT_BAR_HEIGHT,
} from "../../shared/types";

const SCENE_W = 480;
const SCENE_H = 380;

const notificationStyle: React.CSSProperties = {
  position: "absolute",
  top: "8px",
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(40, 40, 60, 0.9)",
  color: "#eeeeff",
  padding: "4px 12px",
  borderRadius: "4px",
  fontSize: "12px",
  zIndex: 20,
  pointerEvents: "none",
};

const loadingStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "200px",
  color: "#888",
  fontSize: "14px",
};

export const App: React.FC = () => {
  const { state, notification, sendMessage } = useGameState();
  const [storeOpen, setStoreOpen] = useState(false);

  // Compute fish bounds from tank layout
  const fishBounds: FishBounds = useMemo(() => {
    if (!state) return { left: 0, top: 0, width: 100, height: 100 };
    const { width: tankWidth, height: tankHeight } =
      TANK_RENDER_SIZES[state.tank.sizeTier];
    const deskTop = SCENE_H - DESK_HEIGHT;
    const tankTop = deskTop - tankHeight;
    const tankLeft = (SCENE_W - tankWidth) / 2;
    const frameThickness = 3;
    return {
      left: tankLeft + frameThickness,
      top: tankTop + frameThickness,
      width: tankWidth - frameThickness * 2,
      height: tankHeight - frameThickness * 2 - 8, // minus sand
    };
  }, [state?.tank.sizeTier]);

  const { animatedFish, frameCount } = useFishAnimation(
    state?.fish,
    state?.lightOn ?? true,
    fishBounds
  );

  if (!state) {
    return <div style={loadingStyle}>Connecting to Pomotank...</div>;
  }

  return (
    <div style={{ position: "relative", background: "#181825" }}>
      {/* Canvas scene */}
      <TankScene
        state={state}
        animatedFish={animatedFish}
        frameCount={frameCount}
      />

      {/* Stats bar */}
      <StatsBar state={state} />

      {/* Action buttons */}
      <Actions
        sendMessage={sendMessage}
        lightOn={state.lightOn}
        onStoreToggle={() => setStoreOpen((o) => !o)}
      />

      {/* Notification toast */}
      {notification && <div style={notificationStyle}>{notification}</div>}

      {/* Store overlay */}
      <Store
        items={state.store.items}
        sendMessage={sendMessage}
        visible={storeOpen}
      />
    </div>
  );
};
