import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useGameState } from './hooks/useGameState';
import { useFishAnimation } from './hooks/useFishAnimation';
import type { FishBounds } from './hooks/useFishAnimation';
import { useSpriteLoader } from './hooks/useSpriteLoader';
import { useContainerSize } from './hooks/useContainerSize';
import { TankScene } from './components/TankScene';
import { Store } from './components/Store';
import { SettingsPanel } from './components/SettingsPanel';
import { DebugPanel } from './components/DebugPanel';
import { useSettings } from './hooks/useSettings';
import { TANK_RENDER_SIZES } from '../../shared/types';

/** Aspect ratio: height / width */
const ASPECT = 380 / 480;
/** Default CSS width used before ResizeObserver fires */
const FALLBACK_W = 480;

export const App: React.FC = () => {
  const { state, notification, sendMessage, spriteUriMap, feedingActive } = useGameState();
  const { images: spriteImages } = useSpriteLoader(spriteUriMap);
  const { settings, updateSetting } = useSettings(sendMessage);
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
    state?.tank.sizeTier,
  );

  if (!state) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'text.disabled' }}>
        <Typography>Connecting to Pomotank...</Typography>
      </Box>
    );
  }

  return (
    <Box ref={ref} sx={{ position: 'relative', bgcolor: 'background.default', width: '100%' }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', p: '4px', bgcolor: 'background.default' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => setStoreOpen((o) => !o)}
          sx={{
            px: 2,
            py: '4px',
            fontSize: '11px',
            borderColor: 'border.main',
            bgcolor: 'background.paper',
            color: 'text.primary',
            '&:hover': { borderColor: 'border.main', bgcolor: 'background.panel' },
          }}
        >
          Store
        </Button>
      </Box>

      {/* Settings panel (collapsible) */}
      <Box sx={{ px: '4px', bgcolor: 'background.default' }}>
        <SettingsPanel settings={settings} onUpdateSetting={updateSetting} />
      </Box>

      {/* Notification toast */}
      <Snackbar
        open={!!notification}
        message={notification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={3000}
        ContentProps={{
          sx: {
            bgcolor: 'rgba(40, 40, 60, 0.9)',
            color: 'text.bright',
            fontSize: '12px',
            minWidth: 'auto',
            py: '4px',
            px: '12px',
            boxShadow: 'none',
          },
        }}
      />

      {/* Debug panel (only visible when debugMode enabled) */}
      {state.debugMode && (
        <DebugPanel
          pomoBalance={state.player.pomoBalance}
          onSetPomo={(amount) => sendMessage({ type: 'debugSetPomo', amount })}
          onResetState={() => sendMessage({ type: 'debugResetState' })}
        />
      )}

      {/* Store overlay */}
      <Store items={state.store.items} sendMessage={sendMessage} visible={storeOpen} onClose={() => setStoreOpen(false)} />
    </Box>
  );
};
