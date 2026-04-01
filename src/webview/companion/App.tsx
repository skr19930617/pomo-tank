import React, { useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useGameState } from '../tank-panel/hooks/useGameState';
import { useFishAnimation } from '../tank-panel/hooks/useFishAnimation';
import type { FishBounds } from '../tank-panel/hooks/useFishAnimation';
import { useSpriteLoader } from '../tank-panel/hooks/useSpriteLoader';
import { useContainerSize, fitScene } from '../tank-panel/hooks/useContainerSize';
import { TankScene } from '../tank-panel/components/TankScene';
import { getTank } from '../../game/tanks';
import { useSpriteUriMap } from '../tank-panel/contexts/sprite-context';
import type { UseFeedingModeResult } from '../tank-panel/hooks/useFeedingMode';
import type { UseWaterChangeModeResult } from '../tank-panel/hooks/useWaterChangeMode';
import type { UseMossCleaningModeResult } from '../tank-panel/hooks/useMossCleaningMode';

/** Fixed logical scene dimensions — the coordinate space everything is designed in. */
const SCENE_W = 110;
const SCENE_H = 90;
const SCENE_ASPECT = SCENE_H / SCENE_W;

const noop = () => {};

const IDLE_FEEDING_MODE: UseFeedingModeResult = {
  phase: 'idle',
  particles: [],
  canState: null,
  attractionTarget: null,
  startTargeting: noop,
  cancelTargeting: noop,
  confirmDrop: noop,
  updateAnimation: () => false,
  forceReset: noop,
};

const IDLE_WATER_CHANGE_MODE: UseWaterChangeModeResult = {
  phase: 'idle',
  waterLevelRatio: 1,
  waterColorOverride: null,
  snapshotDirtiness: 0,
  pendingCompletion: false,
  startReady: noop,
  cancelReady: noop,
  startDraining: noop,
  updateAnimation: () => false,
  forceReset: noop,
};

const IDLE_MOSS_CLEANING_MODE: UseMossCleaningModeResult = {
  phase: 'idle',
  localAlgaeLevel: 0,
  sparkles: [],
  bubbles: [],
  startCleaning: noop,
  cancelCleaning: noop,
  onMouseDown: noop,
  onMouseMove: noop,
  onMouseUp: noop,
  onMouseLeave: noop,
  updateAnimation: () => 0,
  isJustCompleted: () => false,
  getTotalReduction: () => 0,
};

export function App() {
  const { state, sendMessage } = useGameState();
  const spriteUriMap = useSpriteUriMap();
  const { images: spriteImages } = useSpriteLoader(
    Object.keys(spriteUriMap).length > 0 ? spriteUriMap : null,
  );
  const { ref, size, renderSize } = useContainerSize(220, 180);

  // fitted: updates every frame (for CSS transform), render: debounced (for canvas)
  const fitted = fitScene(SCENE_ASPECT, size.width, size.height);
  const rendered = fitScene(SCENE_ASPECT, renderSize.width, renderSize.height);

  const scaleX = rendered.width > 0 ? fitted.width / rendered.width : 1;
  const scaleY = rendered.height > 0 ? fitted.height / rendered.height : 1;

  const tankId = state?.tank.tankId;
  const fishBounds: FishBounds = useMemo(() => {
    if (!tankId) return { left: 0, top: 0, width: 60, height: 40, tankFloorY: 40 };
    const tank = getTank(tankId);
    if (!tank) return { left: 0, top: 0, width: 60, height: 40, tankFloorY: 40 };
    const frame = 3;
    const sand = 8;
    const innerH = tank.renderHeight - frame * 2;
    return {
      left: frame,
      top: frame,
      width: tank.renderWidth - frame * 2,
      height: innerH - sand,
      tankFloorY: frame + innerH,
    };
  }, [tankId]);

  const { animatedFish, frameCount } = useFishAnimation(
    state?.fish,
    state?.lightOn ?? true,
    fishBounds,
    state?.tank.tankId,
  );

  const handleOpenTank = useCallback(() => {
    sendMessage({ type: 'openTank' });
  }, [sendMessage]);

  if (!state) {
    return (
      <Box sx={{ p: 1, color: 'text.disabled' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
      }}
      onClick={handleOpenTank}
    >
      <Box
        sx={{
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <TankScene
          state={state}
          animatedFish={animatedFish}
          frameCount={frameCount}
          sceneWidth={SCENE_W}
          sceneHeight={SCENE_H}
          containerWidth={rendered.width}
          containerHeight={rendered.height}
          compact={true}
          spriteImages={spriteImages}
          feedingMode={IDLE_FEEDING_MODE}
          waterChangeMode={IDLE_WATER_CHANGE_MODE}
          mossCleaningMode={IDLE_MOSS_CLEANING_MODE}
        />
      </Box>
      {/* Transparent overlay to catch clicks over Konva Stage */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
        }}
      />
    </Box>
  );
}
