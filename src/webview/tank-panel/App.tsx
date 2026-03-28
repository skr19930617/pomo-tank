import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import { useGameState } from './hooks/useGameState';
import { useFishAnimation } from './hooks/useFishAnimation';
import type { FishBounds } from './hooks/useFishAnimation';
import { useFeedingMode } from './hooks/useFeedingMode';
import { useWaterChangeMode } from './hooks/useWaterChangeMode';
import { useMossCleaningMode } from './hooks/useMossCleaningMode';
import { useSpriteLoader } from './hooks/useSpriteLoader';
import { useContainerSize, fitScene } from './hooks/useContainerSize';
import { TankScene } from './components/TankScene';
import { Store } from './components/Store';
import { SettingsPanel } from './components/SettingsPanel';
import { DebugPanel } from './components/DebugPanel';
import { TankManager } from './components/TankManager';
import { FishManager } from './components/FishManager';
import { useSettings } from './hooks/useSettings';
import { getTank } from '../../game/tanks';
import { useSpriteUriMap } from './contexts/sprite-context';

/** Fixed logical scene dimensions — the coordinate space everything is designed in. */
const SCENE_W = 240;
const SCENE_H = 190;
const SCENE_ASPECT = SCENE_H / SCENE_W;

export const App: React.FC = () => {
  const { state, notification, sendMessage } = useGameState();
  const spriteUriMap = useSpriteUriMap();
  const { images: spriteImages } = useSpriteLoader(Object.keys(spriteUriMap).length > 0 ? spriteUriMap : null);
  const { settings, updateSetting } = useSettings(sendMessage);
  const [storeOpen, setStoreOpen] = useState(false);
  const feedingMode = useFeedingMode();
  const waterChangeMode = useWaterChangeMode();
  const mossCleaningMode = useMossCleaningMode();
  const { ref, size, renderSize } = useContainerSize(480, 380);

  // fitted: updates every frame (for CSS transform), render: debounced (for canvas)
  const fitted = fitScene(SCENE_ASPECT, size.width, size.height);
  const rendered = fitScene(SCENE_ASPECT, renderSize.width, renderSize.height);

  // CSS scale bridges the gap between expensive canvas renders
  const scaleX = rendered.width > 0 ? fitted.width / rendered.width : 1;
  const scaleY = rendered.height > 0 ? fitted.height / rendered.height : 1;

  const waterLevelRatio = waterChangeMode.waterLevelRatio;
  const fishBounds: FishBounds = useMemo(() => {
    if (!state) return { left: 0, top: 0, width: 100, height: 100 };
    const tank = getTank(state.tank.tankId);
    if (!tank) return { left: 0, top: 0, width: 100, height: 100 };
    const frame = 3;
    const sand = 8;
    // Match Tank.tsx water surface calculation exactly
    const innerH = tank.renderHeight - frame * 2;
    const waterH = innerH * waterLevelRatio;
    const waterTop = frame + innerH - waterH; // top of water in tank-local coords
    return {
      left: frame,
      top: waterTop,
      width: tank.renderWidth - frame * 2,
      height: waterH - sand,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.tank.tankId, waterLevelRatio]);

  const { animatedFish, frameCount } = useFishAnimation(
    state?.fish,
    state?.lightOn ?? true,
    fishBounds,
    state?.tank.tankId,
    feedingMode.attractionTarget,
  );

  if (!state) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'text.disabled' }}>
        <Typography>Connecting to Pomotank...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: '12px' }}>
      {/* Scene area — flexes to fill available space */}
      <Box
        ref={ref}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: 'center center', willChange: 'transform' }}>
          <TankScene
            state={state}
            animatedFish={animatedFish}
            frameCount={frameCount}
            sceneWidth={SCENE_W}
            sceneHeight={SCENE_H}
            containerWidth={rendered.width}
            containerHeight={rendered.height}
            compact={false}
            sendMessage={sendMessage}
            showExpand={false}
            spriteImages={spriteImages}
            feedingMode={feedingMode}
            waterChangeMode={waterChangeMode}
            mossCleaningMode={mossCleaningMode}
          />
        </Box>
      </Box>

      {/* Controls area — scrolls independently, disabled during water change animation */}
      <Box sx={{ flexShrink: 0, overflowY: 'auto', maxHeight: '40%', ...(state.waterChangeAnimating ? { pointerEvents: 'none', opacity: 0.5 } : {}) }}>
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

        {/* Settings panels (collapsible) */}
        <Box sx={{ px: '4px', bgcolor: 'background.default' }}>
          <SettingsPanel settings={settings} onUpdateSetting={updateSetting} />
          <TankManager state={state} sendMessage={sendMessage} />
          <FishManager state={state} sendMessage={sendMessage} />
        </Box>

        {/* Debug panel (only visible when debugMode enabled) */}
        {state.debugMode && (
          <DebugPanel
            pomoBalance={state.player.pomoBalance}
            tickMultiplier={state.tickMultiplier}
            onSetPomo={(amount) => sendMessage({ type: 'debugSetPomo', amount })}
            onSetTickMultiplier={(multiplier) => sendMessage({ type: 'debugSetTickMultiplier', multiplier })}
            onResetState={() => sendMessage({ type: 'debugResetState' })}
          />
        )}
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

      {/* Store overlay */}
      <Store items={state.store.items} sendMessage={sendMessage} visible={storeOpen} onClose={() => setStoreOpen(false)} />
    </Box>
  );
};
