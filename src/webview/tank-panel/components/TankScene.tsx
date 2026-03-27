import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import type Konva from 'konva';
import { useVisibilityResume } from '../hooks/useVisibilityResume';
import type { GameStateSnapshot } from '../../../game/state';
import {
  DESK_HEIGHT,
  LIGHT_BAR_HEIGHT,
  LIGHT_GAP_RATIO,
  HUD_HEIGHT,
  HUD_BOTTOM_PAD,
} from '../../../shared/types';
import { getTank } from '../../../game/tanks';
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
import { FoodOverlay } from './FoodOverlay';
import { AlgaeOverlay } from './AlgaeOverlay';
import { useTimer } from '../hooks/useTimer';
import type { UseFeedingModeResult } from '../hooks/useFeedingMode';

const DEFAULT_SCENE_W = 480;
const DEFAULT_SCENE_H = 380;

/** Tank cluster occupies this fraction of available width/height (rest is margin). */
const CLUSTER_FILL = 0.92;

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

  const lightGap = rawTankH * LIGHT_GAP_RATIO;
  const clusterH = rawTankH + LIGHT_BAR_HEIGHT + lightGap;
  const totalW = sceneWidth;
  const totalH = deskTop - HUD_HEIGHT - HUD_BOTTOM_PAD;
  const availW = totalW * CLUSTER_FILL;
  const availH = totalH * CLUSTER_FILL;

  const contentScale = Math.min(availW / rawTankW, availH / clusterH);

  const scaledTankW = rawTankW * contentScale;
  const scaledTankH = rawTankH * contentScale;

  // Pin tank bottom to desk top, extra space goes above the light
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
  feedingMode: UseFeedingModeResult;
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
  feedingMode,
}) => {
  const tankConfig = getTank(state.tank.tankId);
  const rawTankW = tankConfig?.renderWidth ?? 200;
  const rawTankH = tankConfig?.renderHeight ?? 150;

  const layout = useMemo(
    () => computeTankLayout(sceneWidth, sceneHeight, rawTankW, rawTankH),
    [sceneWidth, sceneHeight, rawTankW, rawTankH],
  );

  const { contentScale, tankX, tankY, deskTop } = layout;
  const [selectedFishId, setSelectedFishId] = useState<string | null>(null);
  const stageRef = useRef<Konva.Stage>(null);
  useVisibilityResume(stageRef);

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

  const lightGapRaw = rawTankH * LIGHT_GAP_RATIO;
  const lightTopRaw = -(LIGHT_BAR_HEIGHT + lightGapRaw);

  // ── Feeding mode: water surface Y in tank-local coords ──
  const frameThickness = 3;
  const innerH = rawTankH - frameThickness * 2;
  const waterH = innerH * 0.9;
  const waterSurfaceY = frameThickness + innerH - waterH; // top of water in tank coords

  // ── Feeding mode: custom cursor ──
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;
    if (feedingMode.phase === 'targeting') {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
    return () => { container.style.cursor = ''; };
  }, [feedingMode.phase]);

  // ── Feeding mode: ESC to cancel targeting ──
  useEffect(() => {
    if (feedingMode.phase !== 'targeting') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        feedingMode.cancelTargeting();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedingMode.phase, feedingMode.cancelTargeting]);

  // ── Feeding mode: click handler on stage ──
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (feedingMode.phase !== 'targeting') return;

      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert stage pixel coords → logical scene coords
      const logicalX = pointer.x / layerScale;
      const logicalY = pointer.y / layerScale;

      // Convert scene coords → tank-local coords
      const localX = (logicalX - tankX) / contentScale;
      const localY = (logicalY - tankY) / contentScale;

      // Check if click is inside tank water area
      const inTankX = localX >= frameThickness && localX <= rawTankW - frameThickness;
      const inTankY = localY >= waterSurfaceY && localY <= rawTankH - frameThickness;

      if (inTankX && inTankY) {
        const sandTop = rawTankH - frameThickness - 8; // 8px sand strip
        feedingMode.confirmDrop(localX, waterSurfaceY, sandTop);
      } else {
        // Click outside tank water → cancel
        feedingMode.cancelTargeting();
      }
    },
    [feedingMode, layerScale, tankX, tankY, contentScale, rawTankW, rawTankH, waterSurfaceY],
  );

  // ── Feeding mode: animation update + completion ──
  useEffect(() => {
    if (feedingMode.phase !== 'animating' || frameCount === 0) return;
    const completed = feedingMode.updateAnimation(frameCount);
    if (completed && sendMessage) {
      sendMessage({ type: 'feedFish' } as WebviewToExtensionMessage);
    }
  }, [feedingMode, frameCount, sendMessage]);

  return (
    <Stage ref={stageRef} width={stageW} height={stageH} onClick={handleStageClick}>
      <Layer scaleX={layerScale} scaleY={layerScale}>
        {/* Background wall — full scene */}
        <Wall sceneWidth={sceneWidth} sceneHeight={sceneHeight} />

        {/* Desk — full width at bottom */}
        <Desk sceneWidth={sceneWidth} deskTop={deskTop} deskHeight={DESK_HEIGHT} />

        {/* Tank cluster: scaled & positioned group */}
        <Group x={tankX} y={tankY} scaleX={contentScale} scaleY={contentScale}>
          {/* Light bar */}
          <Light tankLeft={0} tankWidth={rawTankW} lightTop={lightTopRaw} lightOn={state.lightOn} lightGap={lightGapRaw} />

          {/* Tank body */}
          <Tank
            tankLeft={0}
            tankTop={0}
            tankWidth={rawTankW}
            tankHeight={rawTankH}
            waterDirtiness={state.tank.waterDirtiness}
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

          {/* Food overlay (can + particles) */}
          {feedingMode.phase === 'animating' && (
            <FoodOverlay
              particles={feedingMode.particles}
              canState={feedingMode.canState}
            />
          )}

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
                feedingActive={feedingMode.phase === 'animating'}
                hasFeedingAnim={genus?.hasFeedingAnim ?? false}
                onClick={() => setSelectedFishId(selectedFishId === f.id ? null : f.id)}
              />
            );
          })}

          {/* Algae overlay — rendered after fish = in front of fish */}
          <AlgaeOverlay
            algaeLevel={state.tank.algaeLevel}
            tankWidth={rawTankW}
            tankHeight={rawTankH}
          />

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
            feedingPhase={feedingMode.phase}
            onFeedClick={feedingMode.startTargeting}
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
