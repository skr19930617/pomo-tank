import React, { useMemo, useState } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import type { GameStateSnapshot } from '../../../game/state';
import {
  TANK_RENDER_SIZES,
  DESK_HEIGHT,
  LIGHT_BAR_HEIGHT,
  HUD_HEIGHT,
} from '../../../shared/types';
import type { AnimatedFishData } from '../hooks/useFishAnimation';
import type { SpriteImageMap } from '../hooks/useSpriteLoader';
import type { WebviewToExtensionMessage } from '../../../shared/messages';
import { getGenus, getSpecies } from '../../../game/species';
import { FishTooltip } from './FishTooltip';
import { Wall } from './Wall';
import { Desk } from './Desk';
import { Light } from './Light';
import { Tank } from './Tank';
import { FishSprite } from './Fish';
import { HudOverlay } from './HudOverlay';
import { ActionBar } from './ActionBar';
import { FilterVisual } from './Filter';
import { useTimer } from '../hooks/useTimer';

const DEFAULT_SCENE_W = 480;
const DEFAULT_SCENE_H = 380;

/** Padding between HUD / desk and the tank cluster. */
const TANK_PAD = 4;

export interface TankLayout {
  contentScale: number;
  scaledTankW: number;
  scaledTankH: number;
  tankX: number;
  tankY: number;
  deskTop: number;
}

/**
 * Fit the tank + light bar into the space between HUD and desk.
 * Tank bottom is pinned to the desk top (sits ON the desk).
 */
export function computeTankLayout(
  sceneWidth: number,
  sceneHeight: number,
  rawTankW: number,
  rawTankH: number,
): TankLayout {
  const deskTop = sceneHeight - DESK_HEIGHT;

  const clusterH = rawTankH + LIGHT_BAR_HEIGHT;
  const availW = sceneWidth - TANK_PAD * 2;
  const availH = deskTop - HUD_HEIGHT - TANK_PAD;

  const contentScale = Math.min(availW / rawTankW, availH / clusterH);

  const scaledTankW = rawTankW * contentScale;
  const scaledTankH = rawTankH * contentScale;

  // Pin tank bottom to desk top
  const tankX = (sceneWidth - scaledTankW) / 2;
  const tankY = deskTop - scaledTankH;

  return { contentScale, scaledTankW, scaledTankH, tankX, tankY, deskTop };
}

interface TankSceneProps {
  state: GameStateSnapshot;
  animatedFish: Map<string, AnimatedFishData>;
  frameCount: number;
  sceneWidth?: number;
  sceneHeight?: number;
  /** Actual CSS-pixel width of the container (for Stage sizing). */
  containerWidth?: number;
  /** Actual CSS-pixel height of the container. */
  containerHeight?: number;
  compact?: boolean;
  sendMessage?: (msg: WebviewToExtensionMessage) => void;
  showExpand?: boolean;
  onExpandClick?: () => void;
  spriteImages: SpriteImageMap;
  feedingActive: boolean;
}

export const TankScene: React.FC<TankSceneProps> = ({
  state,
  animatedFish,
  frameCount,
  sceneWidth = DEFAULT_SCENE_W,
  sceneHeight = DEFAULT_SCENE_H,
  containerWidth,
  containerHeight,
  compact = false,
  sendMessage,
  showExpand = false,
  onExpandClick,
  spriteImages,
  feedingActive,
}) => {
  const { width: rawTankW, height: rawTankH } = TANK_RENDER_SIZES[state.tank.sizeTier];

  const layout = useMemo(
    () => computeTankLayout(sceneWidth, sceneHeight, rawTankW, rawTankH),
    [sceneWidth, sceneHeight, rawTankW, rawTankH],
  );

  const { contentScale, tankX, tankY, deskTop } = layout;
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);

  // Stage dimensions = actual CSS pixel size of the container.
  // Layer scale maps logical sceneWidth → stageWidth so coordinates stay consistent.
  const stageW = containerWidth ?? sceneWidth * 2;
  const stageH = containerHeight ?? sceneHeight * 2;
  const layerScale = stageW / sceneWidth;

  const { displaySeconds, timerColor, isPaused } = useTimer(
    state.session.timeSinceLastMaintenance,
    state.lightOn,
    state.session.sessionMinutes,
    state.session.timerMode,
    state.session.breakRemainingMs,
    state.tickMultiplier,
  );

  const lightTopRaw = -LIGHT_BAR_HEIGHT;

  return (
    <Stage width={stageW} height={stageH}>
      <Layer scaleX={layerScale} scaleY={layerScale}>
        {/* Background wall — full scene */}
        <Wall sceneWidth={sceneWidth} sceneHeight={sceneHeight} />

        {/* Desk — full width at bottom */}
        <Desk sceneWidth={sceneWidth} deskTop={deskTop} deskHeight={DESK_HEIGHT} />

        {/* Tank cluster: scaled & positioned group */}
        <Group x={tankX} y={tankY} scaleX={contentScale} scaleY={contentScale}>
          {/* Light bar */}
          <Light tankLeft={0} tankWidth={rawTankW} lightTop={lightTopRaw} lightOn={state.lightOn} />

          {/* Tank body */}
          <Tank
            tankLeft={0}
            tankTop={0}
            tankWidth={rawTankW}
            tankHeight={rawTankH}
            waterDirtiness={state.tank.waterDirtiness}
            algaeLevel={state.tank.algaeLevel}
            lightOn={state.lightOn}
            filterId={state.tank.filterId}
          />

          {/* External filter (HOB / canister) */}
          <FilterVisual
            filterId={state.tank.filterId}
            tankWidth={rawTankW}
            tankHeight={rawTankH}
            lightOn={state.lightOn}
          />

          {/* Fish */}
          {state.fish.map((f) => {
            const anim = animatedFish.get(f.id);
            if (!anim) return null;
            const genus = getGenus(f.genusId);
            return (
              <FishSprite
                key={f.id}
                x={anim.x}
                y={anim.y}
                dx={anim.dx}
                genusId={f.genusId}
                speciesId={f.speciesId}
                healthState={f.healthState}
                tankHunger={state.tank.hungerLevel}
                frameCount={frameCount}
                displaySize={anim.displaySize}
                spriteImages={spriteImages}
                feedingActive={feedingActive}
                hasFeedingAnim={genus?.hasFeedingAnim ?? false}
                onClick={() => setSelectedFishId(selectedFishId === f.id ? null : f.id)}
              />
            );
          })}

          {/* Fish info tooltip */}
          {selectedFishId && (() => {
            const f = state.fish.find((fi) => fi.id === selectedFishId);
            const anim = f ? animatedFish.get(f.id) : undefined;
            if (!f || !anim) return null;
            const sp = getSpecies(f.genusId, f.speciesId);
            return (
              <FishTooltip
                x={anim.x}
                y={anim.y}
                speciesName={sp?.displayName ?? f.speciesId}
                customName={f.customName}
                bodyLengthMm={f.bodyLengthMm}
                ageWeeks={f.ageWeeks}
                healthState={f.healthState}
                maintenanceQuality={f.maintenanceQuality}
              />
            );
          })()}
        </Group>

        {/* Action bar — on desk area */}
        {sendMessage && (
          <ActionBar
            sceneWidth={sceneWidth}
            sceneHeight={sceneHeight}
            sendMessage={sendMessage}
            lightOn={state.lightOn}
            showExpand={showExpand}
            onExpandClick={onExpandClick}
            avgHunger={state.tank.hungerLevel}
            waterDirtiness={state.tank.waterDirtiness}
            algaeLevel={state.tank.algaeLevel}
          />
        )}

        {/* HUD overlay — top, rendered last = on top */}
        <HudOverlay
          sceneWidth={sceneWidth}
          timerSeconds={displaySeconds}
          timerColor={timerColor}
          isPaused={isPaused}
          compact={compact}
          pomoBalance={state.player.pomoBalance}
          currentCost={state.capacity.current}
          maxCost={state.capacity.max}
          tankHunger={state.tank.hungerLevel}
          waterDirtiness={state.tank.waterDirtiness}
          algaeLevel={state.tank.algaeLevel}
          currentStreak={state.player.currentStreak}
        />
      </Layer>
    </Stage>
  );
};
