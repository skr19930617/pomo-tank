import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useGameState } from '../tank-panel/hooks/useGameState';
import { useFishAnimation } from '../tank-panel/hooks/useFishAnimation';
import type { FishBounds } from '../tank-panel/hooks/useFishAnimation';
import { useFeedingMode } from '../tank-panel/hooks/useFeedingMode';
import { useWaterChangeMode } from '../tank-panel/hooks/useWaterChangeMode';
import { useMossCleaningMode } from '../tank-panel/hooks/useMossCleaningMode';
import { useSpriteLoader } from '../tank-panel/hooks/useSpriteLoader';
import { useContainerSize, fitScene } from '../tank-panel/hooks/useContainerSize';
import { TankScene } from '../tank-panel/components/TankScene';
import { getTank } from '../../game/tanks';
import { useSpriteUriMap } from '../tank-panel/contexts/sprite-context';

/** Fixed logical scene dimensions — the coordinate space everything is designed in. */
const SCENE_W = 110;
const SCENE_H = 90;
const SCENE_ASPECT = SCENE_H / SCENE_W;

export function App() {
  const { state, sendMessage } = useGameState();
  const spriteUriMap = useSpriteUriMap();
  const feedingMode = useFeedingMode();
  const waterChangeMode = useWaterChangeMode();
  const mossCleaningMode = useMossCleaningMode();
  const { images: spriteImages } = useSpriteLoader(
    Object.keys(spriteUriMap).length > 0 ? spriteUriMap : null,
  );
  const { ref, size, renderSize } = useContainerSize(220, 180);

  // fitted: updates every frame (for CSS transform), render: debounced (for canvas)
  const fitted = fitScene(SCENE_ASPECT, size.width, size.height);
  const rendered = fitScene(SCENE_ASPECT, renderSize.width, renderSize.height);

  const scaleX = rendered.width > 0 ? fitted.width / rendered.width : 1;
  const scaleY = rendered.height > 0 ? fitted.height / rendered.height : 1;

  const waterLevelRatio = waterChangeMode.waterLevelRatio;
  const fishBounds: FishBounds = useMemo(() => {
    if (!state) return { left: 0, top: 0, width: 60, height: 40, tankFloorY: 40 };
    const tank = getTank(state.tank.tankId);
    if (!tank) return { left: 0, top: 0, width: 60, height: 40, tankFloorY: 40 };
    const frame = 3;
    const sand = 8;
    // Match Tank.tsx water surface calculation exactly
    const innerH = tank.renderHeight - frame * 2;
    const waterH = innerH * waterLevelRatio;
    const waterTop = frame + innerH - waterH;
    return {
      left: frame,
      top: waterTop,
      width: tank.renderWidth - frame * 2,
      height: waterH - sand,
      tankFloorY: frame + innerH,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.tank.tankId, waterLevelRatio]);

  const { animatedFish, frameCount } = useFishAnimation(
    state?.fish,
    state?.lightOn ?? true,
    fishBounds,
    state?.tank.tankId,
  );

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
      }}
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
          sendMessage={sendMessage}
          showExpand={true}
          onExpandClick={() => sendMessage({ type: 'openTank' })}
          spriteImages={spriteImages}
          feedingMode={feedingMode}
          waterChangeMode={waterChangeMode}
          mossCleaningMode={mossCleaningMode}
        />
      </Box>
    </Box>
  );
}
