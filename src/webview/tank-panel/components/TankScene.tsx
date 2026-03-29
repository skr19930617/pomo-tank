import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Group, Rect } from 'react-konva';
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
import { HealthState } from '../../../shared/types';
import type { GenusId } from '../../../shared/types';
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
import type { UseWaterChangeModeResult } from '../hooks/useWaterChangeMode';
import type { UseMossCleaningModeResult } from '../hooks/useMossCleaningMode';
import { SPONGE_CURSOR } from '../hooks/useMossCleaningMode';
import { Shape } from 'react-konva';

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
  waterChangeMode: UseWaterChangeModeResult;
  mossCleaningMode: UseMossCleaningModeResult;
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
  waterChangeMode,
  mossCleaningMode,
}) => {
  const tankConfig = getTank(state.tank.tankId);
  const rawTankW = tankConfig?.renderWidth ?? 200;
  const rawTankH = tankConfig?.renderHeight ?? 150;

  const layout = useMemo(
    () => computeTankLayout(sceneWidth, sceneHeight, rawTankW, rawTankH),
    [sceneWidth, sceneHeight, rawTankW, rawTankH],
  );

  const { contentScale, tankX, tankY, deskTop } = layout;
  // ── Hover / dead-fish interaction state (Tank Panel only, gated by !compact) ──
  const [hoveredFishId, setHoveredFishId] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [fadingGhosts, setFadingGhosts] = useState<
    Map<
      string,
      {
        x: number;
        y: number;
        displaySize: number;
        genusId: GenusId;
        speciesId: string;
        startTime: number;
      }
    >
  >(new Map());

  const isAnyModeActive =
    feedingMode.phase === 'targeting' ||
    waterChangeMode.phase === 'ready' ||
    mossCleaningMode.phase === 'active';

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

  // ── Custom cursor for targeting/ready/cleaning modes + dead fish pointer ──
  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;
    if (mossCleaningMode.phase === 'active') {
      container.style.cursor = SPONGE_CURSOR;
    } else if (feedingMode.phase === 'targeting') {
      container.style.cursor = 'crosshair';
    } else if (waterChangeMode.phase === 'ready') {
      container.style.cursor = 'pointer';
    } else if (!compact && hoveredFishId && !isAnyModeActive) {
      // Dead fish hover: show pointer cursor
      const hoveredFish = state.fish.find((f) => f.id === hoveredFishId);
      container.style.cursor = hoveredFish?.healthState === HealthState.Dead ? 'pointer' : '';
    } else {
      container.style.cursor = '';
    }
    return () => {
      container.style.cursor = '';
    };
  }, [
    feedingMode.phase,
    waterChangeMode.phase,
    mossCleaningMode.phase,
    hoveredFishId,
    compact,
    isAnyModeActive,
    state.fish,
  ]);

  // ── Outside-click to cancel water change ready mode ──
  useEffect(() => {
    if (waterChangeMode.phase !== 'ready') return;
    const handleDocClick = (e: MouseEvent) => {
      // If click is inside the Konva stage container, handleStageClick handles it
      const container = stageRef.current?.container();
      if (container && container.contains(e.target as Node)) return;
      waterChangeMode.cancelReady();
    };
    // Use capture phase so we get clicks before any stopPropagation
    document.addEventListener('click', handleDocClick, true);
    return () => document.removeEventListener('click', handleDocClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterChangeMode.phase, waterChangeMode.cancelReady]);

  // ── ESC to cancel targeting/ready/cleaning modes ──
  useEffect(() => {
    const isTargeting = feedingMode.phase === 'targeting';
    const isReady = waterChangeMode.phase === 'ready';
    const isCleaning = mossCleaningMode.phase === 'active';
    if (!isTargeting && !isReady && !isCleaning) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isTargeting) feedingMode.cancelTargeting();
        if (isReady) waterChangeMode.cancelReady();
        if (isCleaning) {
          if (sendMessage)
            sendMessage({
              type: 'mossCleaningCancel',
              totalReduction: mossCleaningMode.getTotalReduction(),
            } as WebviewToExtensionMessage);
          mossCleaningMode.cancelCleaning();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    feedingMode.phase,
    feedingMode.cancelTargeting,
    waterChangeMode.phase,
    waterChangeMode.cancelReady,
    mossCleaningMode.phase,
    mossCleaningMode.cancelCleaning,
    sendMessage,
  ]);

  // ── Mode suppression: clear hover state when any mode activates (FR-010) ──
  useEffect(() => {
    if (!compact && isAnyModeActive) {
      setHoveredFishId(null);
    }
  }, [compact, isAnyModeActive]);

  // ── Per-frame hover re-evaluation for stationary cursor (FR-014) ──
  useEffect(() => {
    if (compact || isAnyModeActive) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert stage pixels → logical coords → tank-local coords
    const logicalX = pointer.x / layerScale;
    const logicalY = pointer.y / layerScale;
    const localX = (logicalX - tankX) / contentScale;
    const localY = (logicalY - tankY) / contentScale;

    // Build sorted fish list (alive first = topmost in Z, then dead by deathOrder desc)
    const sortedFish = [...state.fish]
      .filter((f) => !removingIds.has(f.id))
      .sort((a, b) => {
        const aDead = a.healthState === HealthState.Dead ? 1 : 0;
        const bDead = b.healthState === HealthState.Dead ? 1 : 0;
        if (aDead !== bDead) return aDead - bDead; // alive first (topmost)
        if (aDead && bDead) {
          // Among dead: higher deathOrder = newer = more front
          const aOrder = animatedFish.get(a.id)?.deathOrder ?? 0;
          const bOrder = animatedFish.get(b.id)?.deathOrder ?? 0;
          return bOrder - aOrder;
        }
        return 0;
      });

    let foundId: string | null = null;
    for (const f of sortedFish) {
      const anim = animatedFish.get(f.id);
      if (!anim) continue;
      const half = anim.displaySize / 2;
      if (
        localX >= anim.x - half &&
        localX <= anim.x + half &&
        localY >= anim.y - half &&
        localY <= anim.y + half
      ) {
        foundId = f.id;
        break;
      }
    }
    setHoveredFishId(foundId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, compact]);

  // ── Fade ghost cleanup: remove expired ghosts after 300ms ──
  useEffect(() => {
    if (fadingGhosts.size === 0) return;
    const timer = requestAnimationFrame(() => {
      const now = performance.now();
      let changed = false;
      const newGhosts = new Map(fadingGhosts);
      const newRemoving = new Set(removingIds);
      for (const [id, ghost] of fadingGhosts) {
        if (now - ghost.startTime >= 300) {
          newGhosts.delete(id);
          newRemoving.delete(id);
          changed = true;
        }
      }
      if (changed) {
        setFadingGhosts(newGhosts);
        setRemovingIds(newRemoving);
      }
    });
    return () => cancelAnimationFrame(timer);
  }, [fadingGhosts, removingIds, frameCount]);

  // ── Moss cleaning: mouse event handlers ──
  const lastMossFrameTimeRef = useRef(performance.now());

  const toTankLocal = useCallback(
    (pointer: { x: number; y: number }) => {
      const logicalX = pointer.x / layerScale;
      const logicalY = pointer.y / layerScale;
      const localX = (logicalX - tankX) / contentScale;
      const localY = (logicalY - tankY) / contentScale;
      return { localX, localY };
    },
    [layerScale, tankX, tankY, contentScale],
  );

  const isInTank = useCallback(
    (localX: number, localY: number) => {
      return (
        localX >= frameThickness &&
        localX <= rawTankW - frameThickness &&
        localY >= frameThickness &&
        localY <= rawTankH - frameThickness
      );
    },
    [rawTankW, rawTankH],
  );

  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (mossCleaningMode.phase !== 'active') return;
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;
      const { localX, localY } = toTankLocal(pointer);
      if (isInTank(localX, localY)) {
        lastMossFrameTimeRef.current = performance.now();
        mossCleaningMode.onMouseDown(localX, localY);
      }
    },
    [mossCleaningMode, toTankLocal, isInTank],
  );

  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (mossCleaningMode.phase !== 'active') return;
      const stage = e.target.getStage();
      const pointer = stage?.getPointerPosition();
      if (!pointer) return;
      const { localX, localY } = toTankLocal(pointer);
      if (isInTank(localX, localY)) {
        const now = performance.now();
        const deltaTimeMs = now - lastMossFrameTimeRef.current;
        lastMossFrameTimeRef.current = now;
        mossCleaningMode.onMouseMove(localX, localY, deltaTimeMs);
      } else {
        mossCleaningMode.onMouseLeave();
      }
    },
    [mossCleaningMode, toTankLocal, isInTank],
  );

  const handleStageMouseUp = useCallback(() => {
    if (mossCleaningMode.phase !== 'active') return;
    mossCleaningMode.onMouseUp();
  }, [mossCleaningMode]);

  const handleStageMouseLeave = useCallback(() => {
    if (mossCleaningMode.phase !== 'active') return;
    mossCleaningMode.onMouseLeave();
  }, [mossCleaningMode]);

  // ── Click handler on stage (feeding targeting + water change ready) ──
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Suppress during moss cleaning mode
      if (mossCleaningMode.phase !== 'idle') return;

      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert stage pixel coords → logical scene coords → tank-local coords
      const logicalX = pointer.x / layerScale;
      const logicalY = pointer.y / layerScale;
      const localX = (logicalX - tankX) / contentScale;
      const localY = (logicalY - tankY) / contentScale;

      const inTankX = localX >= frameThickness && localX <= rawTankW - frameThickness;
      const inTankY = localY >= waterSurfaceY && localY <= rawTankH - frameThickness;

      // ── Water change ready mode — full tank inner area triggers start ──
      if (waterChangeMode.phase === 'ready') {
        const inTankFull =
          inTankX && localY >= frameThickness && localY <= rawTankH - frameThickness;
        if (inTankFull && !state.waterChangeAnimating) {
          waterChangeMode.startDraining(state.tank.waterDirtiness, state.tank.algaeLevel);
          if (sendMessage)
            sendMessage({ type: 'waterChangeAnimStart' } as WebviewToExtensionMessage);
        } else {
          waterChangeMode.cancelReady();
        }
        return;
      }

      // ── Feeding targeting mode ──
      if (feedingMode.phase === 'targeting') {
        if (inTankX && inTankY) {
          const sandTop = rawTankH - frameThickness - 8; // 8px sand strip
          feedingMode.confirmDrop(localX, waterSurfaceY, sandTop);
        } else {
          feedingMode.cancelTargeting();
        }
        return;
      }
    },
    [
      feedingMode,
      waterChangeMode,
      mossCleaningMode.phase,
      state.tank.waterDirtiness,
      state.tank.algaeLevel,
      state.waterChangeAnimating,
      sendMessage,
      layerScale,
      tankX,
      tankY,
      contentScale,
      rawTankW,
      rawTankH,
      waterSurfaceY,
    ],
  );

  // ── Feeding mode: animation update + completion ──
  useEffect(() => {
    if (feedingMode.phase !== 'animating' || frameCount === 0) return;
    const completed = feedingMode.updateAnimation(frameCount);
    if (completed && sendMessage) {
      sendMessage({ type: 'feedFish' } as WebviewToExtensionMessage);
    }
  }, [feedingMode, frameCount, sendMessage]);

  // ── Moss cleaning: animation update + message sending ──
  const mcPhase = mossCleaningMode.phase;
  const mcActive = mcPhase === 'active' || mcPhase === 'completing';

  useEffect(() => {
    if (!mcActive || frameCount === 0) return;
    const reduction = mossCleaningMode.updateAnimation(rawTankW, rawTankH);
    if (reduction > 0 && sendMessage) {
      sendMessage({ type: 'mossCleaningProgress', reduction } as WebviewToExtensionMessage);
    }
    if (mossCleaningMode.isJustCompleted() && sendMessage) {
      sendMessage({ type: 'mossCleaningComplete' } as WebviewToExtensionMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mcActive, frameCount, sendMessage]);

  // ── Water change ──
  const wcPhase = waterChangeMode.phase;
  const wcAnimating = wcPhase === 'draining' || wcPhase === 'paused' || wcPhase === 'filling';

  // Water change: animation update + completion
  useEffect(() => {
    if (!wcAnimating || frameCount === 0) return;
    const completed = waterChangeMode.updateAnimation();
    if (completed && sendMessage) {
      // Single atomic message: unfreeze + apply maintenance effect together
      sendMessage({ type: 'waterChangeComplete' } as WebviewToExtensionMessage);
      // Delay forceReset so the final color override persists until stateUpdate arrives
      requestAnimationFrame(() => waterChangeMode.forceReset());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wcAnimating, frameCount, sendMessage]);

  return (
    <Stage
      ref={stageRef}
      width={stageW}
      height={stageH}
      onClick={handleStageClick}
      onMouseDown={handleStageMouseDown}
      onMouseMove={handleStageMouseMove}
      onMouseUp={handleStageMouseUp}
      onMouseLeave={handleStageMouseLeave}
    >
      <Layer scaleX={layerScale} scaleY={layerScale}>
        {/* Background wall — full scene */}
        <Wall sceneWidth={sceneWidth} sceneHeight={sceneHeight} />

        {/* Desk — full width at bottom */}
        <Desk sceneWidth={sceneWidth} deskTop={deskTop} deskHeight={DESK_HEIGHT} />

        {/* Tank cluster: scaled & positioned group */}
        <Group x={tankX} y={tankY} scaleX={contentScale} scaleY={contentScale}>
          {/* Light bar */}
          <Light
            tankLeft={0}
            tankWidth={rawTankW}
            lightTop={lightTopRaw}
            lightOn={state.lightOn}
            lightGap={lightGapRaw}
          />

          {/* Tank body */}
          <Tank
            tankLeft={0}
            tankTop={0}
            tankWidth={rawTankW}
            tankHeight={rawTankH}
            waterDirtiness={
              wcAnimating || waterChangeMode.pendingCompletion
                ? waterChangeMode.snapshotDirtiness
                : state.tank.waterDirtiness
            }
            lightOn={state.lightOn}
            filterId={state.tank.filterId}
            waterLevelRatio={waterChangeMode.waterLevelRatio}
            waterColorOverride={waterChangeMode.waterColorOverride}
          />

          {/* Water change ready mode indicator — pulsing overlay */}
          {waterChangeMode.phase === 'ready' && (
            <Rect
              x={frameThickness}
              y={waterSurfaceY}
              width={rawTankW - frameThickness * 2}
              height={rawTankH - frameThickness - waterSurfaceY}
              fill="#4488cc"
              opacity={0.12 + 0.08 * Math.sin(frameCount * 0.08)}
            />
          )}

          {/* External filter (HOB / canister) */}
          <FilterVisual
            filterId={state.tank.filterId}
            tankWidth={rawTankW}
            tankHeight={rawTankH}
            lightOn={state.lightOn}
          />

          {/* Food overlay (can + particles) */}
          {feedingMode.phase === 'animating' && (
            <FoodOverlay particles={feedingMode.particles} canState={feedingMode.canState} />
          )}

          {/* Fish — Z-sorted: dead fish in back, alive fish in front (FR-005a) */}
          {(() => {
            const visibleFish = state.fish.filter((f) => !removingIds.has(f.id));
            const sorted = compact
              ? visibleFish
              : [...visibleFish].sort((a, b) => {
                  const aDead = a.healthState === HealthState.Dead ? 1 : 0;
                  const bDead = b.healthState === HealthState.Dead ? 1 : 0;
                  if (aDead !== bDead) return bDead - aDead; // dead first (back)
                  if (aDead && bDead) {
                    const aOrder = animatedFish.get(a.id)?.deathOrder ?? 0;
                    const bOrder = animatedFish.get(b.id)?.deathOrder ?? 0;
                    return aOrder - bOrder; // older dead = further back
                  }
                  return 0;
                });
            return sorted.map((f) => {
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
                  isHovered={!compact && hoveredFishId === f.id}
                  onMouseEnter={
                    compact
                      ? undefined
                      : () => {
                          if (!isAnyModeActive && !removingIds.has(f.id)) setHoveredFishId(f.id);
                        }
                  }
                  onMouseLeave={compact ? undefined : () => setHoveredFishId(null)}
                  onClick={
                    compact
                      ? undefined
                      : () => {
                          if (
                            f.healthState === HealthState.Dead &&
                            !isAnyModeActive &&
                            sendMessage
                          ) {
                            // Immediately clear hover (FR-015) and mark as removing
                            setHoveredFishId(null);
                            setRemovingIds((prev) => new Set(prev).add(f.id));
                            setFadingGhosts((prev) => {
                              const next = new Map(prev);
                              next.set(f.id, {
                                x: anim.x,
                                y: anim.y,
                                displaySize: anim.displaySize,
                                genusId: f.genusId,
                                speciesId: f.speciesId,
                                startTime: performance.now(),
                              });
                              return next;
                            });
                            sendMessage({ type: 'removeFish', fishId: f.id });
                          }
                          // Alive fish click = no-op (FR-009)
                        }
                  }
                />
              );
            });
          })()}

          {/* Fade-out ghosts for removed dead fish (FR-015) */}
          {fadingGhosts.size > 0 &&
            [...fadingGhosts.entries()].map(([id, ghost]) => {
              const elapsed = performance.now() - ghost.startTime;
              // FishSprite already applies opacity=0.4 for Dead fish, so wrapper is fade-only
              const opacity = Math.max(0, 1 - elapsed / 300);
              const genus = getGenus(ghost.genusId as GenusId);
              return (
                <Group key={`ghost-${id}`} listening={false} opacity={opacity}>
                  <FishSprite
                    x={ghost.x}
                    y={ghost.y}
                    dx={0}
                    genusId={ghost.genusId as GenusId}
                    speciesId={ghost.speciesId}
                    healthState={HealthState.Dead}
                    tankHunger={0}
                    frameCount={frameCount}
                    displaySize={ghost.displaySize}
                    spriteImages={spriteImages}
                    feedingActive={false}
                    hasFeedingAnim={genus?.hasFeedingAnim ?? false}
                  />
                </Group>
              );
            })}

          {/* Algae overlay — rendered after fish = in front of fish */}
          <AlgaeOverlay
            algaeLevel={mcActive ? mossCleaningMode.localAlgaeLevel : state.tank.algaeLevel}
            tankWidth={rawTankW}
            tankHeight={rawTankH}
          />

          {/* Moss cleaning bubble effect (during active dragging) */}
          {mcActive && mossCleaningMode.bubbles.length > 0 && (
            <Shape
              sceneFunc={(context, shape) => {
                const ctx = context._context;
                for (const b of mossCleaningMode.bubbles) {
                  ctx.save();
                  ctx.globalAlpha = b.opacity;
                  ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
                  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                  ctx.lineWidth = 0.5;
                  ctx.beginPath();
                  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.stroke();
                  ctx.restore();
                }
                context.fillStrokeShape(shape);
              }}
              listening={false}
            />
          )}

          {/* Moss cleaning sparkle effect */}
          {mossCleaningMode.phase === 'completing' && mossCleaningMode.sparkles.length > 0 && (
            <Shape
              sceneFunc={(context, shape) => {
                const ctx = context._context;
                for (const p of mossCleaningMode.sparkles) {
                  ctx.save();
                  ctx.globalAlpha = p.opacity;
                  ctx.fillStyle = '#ffffaa';
                  ctx.strokeStyle = '#ffdd44';
                  ctx.lineWidth = 0.5;
                  // Draw a 4-pointed star
                  const s = p.size;
                  ctx.beginPath();
                  ctx.moveTo(p.x, p.y - s);
                  ctx.lineTo(p.x + s * 0.3, p.y - s * 0.3);
                  ctx.lineTo(p.x + s, p.y);
                  ctx.lineTo(p.x + s * 0.3, p.y + s * 0.3);
                  ctx.lineTo(p.x, p.y + s);
                  ctx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
                  ctx.lineTo(p.x - s, p.y);
                  ctx.lineTo(p.x - s * 0.3, p.y - s * 0.3);
                  ctx.closePath();
                  ctx.fill();
                  ctx.stroke();
                  ctx.restore();
                }
                context.fillStrokeShape(shape);
              }}
              listening={false}
            />
          )}

          {/* Fish info tooltip — hover-based (FR-001/FR-018) */}
          {!compact &&
            hoveredFishId &&
            (() => {
              const f = state.fish.find((fi) => fi.id === hoveredFishId);
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
            waterChangePhase={waterChangeMode.phase}
            waterChangeAnimatingGlobal={state.waterChangeAnimating}
            mossCleaningPhase={mossCleaningMode.phase}
            onFeedClick={() => {
              if (waterChangeMode.phase === 'idle' && mossCleaningMode.phase === 'idle')
                feedingMode.startTargeting();
            }}
            onWaterClick={() => {
              if (waterChangeMode.phase === 'ready') {
                waterChangeMode.cancelReady();
              } else if (
                waterChangeMode.phase === 'idle' &&
                feedingMode.phase === 'idle' &&
                mossCleaningMode.phase === 'idle' &&
                !state.waterChangeAnimating
              ) {
                waterChangeMode.startReady();
              }
            }}
            onAlgaeClick={() => {
              if (mossCleaningMode.phase === 'active') {
                // Cancel moss cleaning
                if (sendMessage)
                  sendMessage({
                    type: 'mossCleaningCancel',
                    totalReduction: mossCleaningMode.getTotalReduction(),
                  } as WebviewToExtensionMessage);
                mossCleaningMode.cancelCleaning();
              } else if (
                mossCleaningMode.phase === 'idle' &&
                waterChangeMode.phase === 'idle' &&
                feedingMode.phase === 'idle' &&
                !state.waterChangeAnimating
              ) {
                // Start moss cleaning
                if (sendMessage)
                  sendMessage({ type: 'mossCleaningStart' } as WebviewToExtensionMessage);
                mossCleaningMode.startCleaning(state.tank.algaeLevel);
              }
            }}
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
