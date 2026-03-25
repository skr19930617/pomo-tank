import React, { useState, useMemo } from 'react';
import { useGameState } from './hooks/useGameState';
import { useFishAnimation } from './hooks/useFishAnimation';
import type { FishBounds } from './hooks/useFishAnimation';
import { useSpriteLoader } from './hooks/useSpriteLoader';
import { useContainerSize } from './hooks/useContainerSize';
import { TankScene } from './components/TankScene';
import { Store } from './components/Store';
import { TANK_RENDER_SIZES } from '../../shared/types';

/** Aspect ratio: height / width */
const ASPECT = 380 / 480;
/** Default CSS width used before ResizeObserver fires */
const FALLBACK_W = 480;

const notificationStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(40, 40, 60, 0.9)',
  color: '#eeeeff',
  padding: '4px 12px',
  borderRadius: '4px',
  fontSize: '12px',
  zIndex: 20,
  pointerEvents: 'none',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  color: '#888',
  fontSize: '14px',
};

export const App: React.FC = () => {
  const { state, notification, sendMessage, spriteUriMap, feedingActive } = useGameState();
  const { images: spriteImages } = useSpriteLoader(spriteUriMap);
  const [storeOpen, setStoreOpen] = useState(false);
  const { ref, size } = useContainerSize(ASPECT, FALLBACK_W);

  // Logical scene dimensions (Stage renders at 2× pixel scale)
  const sceneW = Math.floor(size.width / 2);
  const sceneH = Math.floor(size.height / 2);

  const fishBounds: FishBounds = useMemo(() => {
    if (!state) return { left: 0, top: 0, width: 100, height: 100 };
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
  );

  if (!state) {
    return <div style={loadingStyle}>Connecting to Pomotank...</div>;
  }

  return (
    <div ref={ref} style={{ position: 'relative', background: '#181825', width: '100%' }}>
      {/* Canvas scene with HUD + ActionBar integrated */}
      <TankScene
        state={state}
        animatedFish={animatedFish}
        frameCount={frameCount}
        sceneWidth={sceneW}
        sceneHeight={sceneH}
        containerWidth={size.width}
        containerHeight={size.height}
        compact={false}
        sendMessage={sendMessage}
        showExpand={false}
        spriteImages={spriteImages}
        feedingActive={feedingActive}
      />

      {/* Store button trigger */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '4px',
          background: '#181825',
        }}
      >
        <button
          style={{
            padding: '4px 16px',
            fontSize: '11px',
            cursor: 'pointer',
            border: '1px solid #444466',
            borderRadius: '3px',
            background: '#2a2a40',
            color: '#ccccdd',
          }}
          onClick={() => setStoreOpen((o) => !o)}
        >
          Store
        </button>
      </div>

      {/* Notification toast */}
      {notification && <div style={notificationStyle}>{notification}</div>}

      {/* Store overlay */}
      <Store items={state.store.items} sendMessage={sendMessage} visible={storeOpen} />
    </div>
  );
};
