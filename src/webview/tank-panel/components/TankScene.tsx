import React from "react";
import { Stage, Layer } from "react-konva";
import type { GameStateSnapshot } from "../../../game/state";
import {
  TANK_RENDER_SIZES,
  DESK_HEIGHT,
  LIGHT_BAR_HEIGHT,
} from "../../../shared/types";
import type { AnimatedFishData } from "../hooks/useFishAnimation";
import { Wall } from "./Wall";
import { Desk } from "./Desk";
import { Light } from "./Light";
import { Tank } from "./Tank";
import { FishSprite } from "./Fish";

const DEFAULT_SCENE_W = 480;
const DEFAULT_SCENE_H = 380;
const S = 2; // Scale factor

interface TankSceneProps {
  state: GameStateSnapshot;
  animatedFish: Map<string, AnimatedFishData>;
  frameCount: number;
  sceneWidth?: number;
  sceneHeight?: number;
}

export const TankScene: React.FC<TankSceneProps> = ({
  state,
  animatedFish,
  frameCount,
  sceneWidth = DEFAULT_SCENE_W,
  sceneHeight = DEFAULT_SCENE_H,
}) => {
  const { width: tankWidth, height: tankHeight } =
    TANK_RENDER_SIZES[state.tank.sizeTier];

  const deskTop = sceneHeight - DESK_HEIGHT;
  const tankBottom = deskTop;
  const tankTop = tankBottom - tankHeight;
  const tankLeft = (sceneWidth - tankWidth) / 2;
  const lightTop = tankTop - LIGHT_BAR_HEIGHT;

  return (
    <Stage width={sceneWidth * S} height={sceneHeight * S}>
      <Layer scaleX={S} scaleY={S}>
        {/* Background wall */}
        <Wall sceneWidth={sceneWidth} sceneHeight={sceneHeight} />

        {/* Desk */}
        <Desk
          sceneWidth={sceneWidth}
          deskTop={deskTop}
          deskHeight={DESK_HEIGHT}
        />

        {/* Light bar */}
        <Light
          tankLeft={tankLeft}
          tankWidth={tankWidth}
          lightTop={lightTop}
          lightOn={state.lightOn}
        />

        {/* Tank */}
        <Tank
          tankLeft={tankLeft}
          tankTop={tankTop}
          tankWidth={tankWidth}
          tankHeight={tankHeight}
          waterDirtiness={state.tank.waterDirtiness}
          algaeLevel={state.tank.algaeLevel}
          lightOn={state.lightOn}
        />

        {/* Fish */}
        {state.fish.map((f) => {
          const anim = animatedFish.get(f.id);
          if (!anim) return null;
          return (
            <FishSprite
              key={f.id}
              x={anim.x}
              y={anim.y}
              dx={anim.dx}
              speciesId={f.speciesId}
              healthState={f.healthState}
              hungerLevel={f.hungerLevel}
              frameCount={frameCount}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};
