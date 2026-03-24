import React, { useMemo } from "react";
import { useGameState } from "../tank-panel/hooks/useGameState";
import { useFishAnimation } from "../tank-panel/hooks/useFishAnimation";
import type { FishBounds } from "../tank-panel/hooks/useFishAnimation";
import { TankScene } from "../tank-panel/components/TankScene";
import {
  TANK_RENDER_SIZES,
  DESK_HEIGHT,
  LIGHT_BAR_HEIGHT,
} from "../../shared/types";

const COMPANION_SCENE_W = 220;
const COMPANION_SCENE_H = 180;
const COMPANION_DESK_H = 20;

export function App() {
  const { state, sendMessage } = useGameState();

  const fishBounds: FishBounds = useMemo(() => {
    if (!state) return { left: 0, top: 0, width: 60, height: 40 };
    const size = TANK_RENDER_SIZES[state.tank.sizeTier];
    // Scale tank to fit companion scene
    const scale = Math.min(
      (COMPANION_SCENE_W - 20) / size.width,
      (COMPANION_SCENE_H - COMPANION_DESK_H - LIGHT_BAR_HEIGHT - 10) / size.height,
    );
    const tw = size.width * scale;
    const th = size.height * scale;
    const deskTop = COMPANION_SCENE_H - COMPANION_DESK_H;
    const tankTop = deskTop - th;
    const tankLeft = (COMPANION_SCENE_W - tw) / 2;
    return {
      left: tankLeft + 3,
      top: tankTop + 3,
      width: tw - 6,
      height: th - 14,
    };
  }, [state?.tank.sizeTier]);

  const { animatedFish, frameCount } = useFishAnimation(
    state?.fish,
    state?.lightOn ?? true,
    fishBounds,
  );

  const handleClick = () => {
    sendMessage({ type: "openTank" });
  };

  if (!state) {
    return <div style={{ padding: 8, color: "#999" }}>Loading...</div>;
  }

  return (
    <div onClick={handleClick} style={{ cursor: "pointer" }}>
      <TankScene
        state={state}
        animatedFish={animatedFish}
        frameCount={frameCount}
        sceneWidth={COMPANION_SCENE_W}
        sceneHeight={COMPANION_SCENE_H}
      />
    </div>
  );
}
