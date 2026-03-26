import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useGameState } from '../tank-panel/hooks/useGameState';
import { useFishAnimation } from '../tank-panel/hooks/useFishAnimation';
import type { FishBounds } from '../tank-panel/hooks/useFishAnimation';
import { useSpriteLoader } from '../tank-panel/hooks/useSpriteLoader';
import { useContainerSize } from '../tank-panel/hooks/useContainerSize';
import { TankScene } from '../tank-panel/components/TankScene';
import { TANK_RENDER_SIZES } from '../../shared/types';

/** Aspect ratio: height / width */
const ASPECT = 180 / 220;
/** Default CSS width used before ResizeObserver fires */
const FALLBACK_W = 220;

export function App() {
  const { state, sendMessage, spriteUriMap, feedingActive } = useGameState();
  const { images: spriteImages } = useSpriteLoader(spriteUriMap);
  const { ref, size } = useContainerSize(ASPECT, FALLBACK_W);

  // Logical scene dimensions (Stage renders at 2× pixel scale)
  const sceneW = Math.floor(size.width / 2);
  const sceneH = Math.floor(size.height / 2);

  const fishBounds: FishBounds = useMemo(() => {
    if (!state) return { left: 0, top: 0, width: 60, height: 40 };
    const rawSize = TANK_RENDER_SIZES[state.tank.sizeTier];
    const frame = 3;
    const sand = 8;
    return {
      left: frame,
      top: frame,
      width: rawSize.width - frame * 2,
      height: rawSize.height - frame * 2 - sand,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.tank.sizeTier]);

  const { animatedFish, frameCount } = useFishAnimation(
    state?.fish,
    state?.lightOn ?? true,
    fishBounds,
    state?.tank.sizeTier,
  );

  if (!state) {
    return (
      <Box sx={{ p: 1, color: 'text.disabled' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box ref={ref} sx={{ width: '100%' }}>
      <TankScene
        state={state}
        animatedFish={animatedFish}
        frameCount={frameCount}
        sceneWidth={sceneW}
        sceneHeight={sceneH}
        containerWidth={size.width}
        containerHeight={size.height}
        compact={true}
        sendMessage={sendMessage}
        showExpand={true}
        onExpandClick={() => sendMessage({ type: 'openTank' })}
        spriteImages={spriteImages}
        feedingActive={feedingActive}
      />
    </Box>
  );
}
