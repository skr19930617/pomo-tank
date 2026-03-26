import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { StoreItemType } from '../../../shared/types';
import type { GameStateSnapshot } from '../../../game/state';
import type { WebviewToExtensionMessage } from '../../../shared/messages';
import { FishPreview } from './FishPreview';
import { PixelIcon, COIN_ICON, COIN_COLOR, FISH_ICON, FISH_COLOR } from './pixel-icons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spriteUriMap: Record<string, Record<string, Record<string, string>>> = (window as any)
  .__SPRITE_URI_MAP__ ?? {};

interface StoreProps {
  items: GameStateSnapshot['store']['items'];
  sendMessage: (msg: WebviewToExtensionMessage) => void;
  visible: boolean;
  onClose: () => void;
}

const SECTION_LABELS: Record<StoreItemType, string> = {
  [StoreItemType.TankUpgrade]: 'Tank Upgrades',
  [StoreItemType.Filter]: 'Filters',
  [StoreItemType.FishSpecies]: 'Fish',
};

const SECTION_ORDER: StoreItemType[] = [
  StoreItemType.TankUpgrade,
  StoreItemType.Filter,
  StoreItemType.FishSpecies,
];

export const Store: React.FC<StoreProps> = ({ items, sendMessage, visible, onClose }) => {
  if (!visible) return null;

  const grouped = new Map<StoreItemType, typeof items>();
  for (const item of items) {
    const group = grouped.get(item.type) ?? [];
    group.push(item);
    grouped.set(item.type, group);
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        pt: '20px',
        zIndex: 10,
        overflowY: 'auto',
      }}
    >
      <Button
        onClick={onClose}
        sx={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          px: '10px',
          py: '4px',
          fontSize: '12px',
          minWidth: 'auto',
          borderColor: '#555',
          bgcolor: '#333344',
          color: 'text.primary',
          border: '1px solid #555',
          borderRadius: '3px',
          '&:hover': { bgcolor: 'background.paper' },
        }}
      >
        X
      </Button>
      <Typography variant="h6" sx={{ color: 'text.bright', mb: '12px' }}>
        Store
      </Typography>
      {SECTION_ORDER.map((type) => {
        const sectionItems = grouped.get(type);
        if (!sectionItems || sectionItems.length === 0) return null;
        return (
          <Box key={type} sx={{ width: '90%', maxWidth: '400px', mb: '12px' }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: 'text.secondary',
                borderBottom: '1px solid #444',
                pb: '4px',
                mb: '6px',
              }}
            >
              {SECTION_LABELS[type]}
            </Typography>
            {sectionItems.map((item) => {
              const canBuy = item.affordable && item.meetsPrerequisites;
              let fishSpriteUri: string | undefined;
              if (item.type === StoreItemType.FishSpecies && item.id.includes(':')) {
                const [genusId, speciesId] = item.id.split(':');
                fishSpriteUri = spriteUriMap[genusId]?.[speciesId]?.swim;
              }
              return (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: '4px',
                    fontSize: '11px',
                    color: 'text.primary',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    {fishSpriteUri && <FishPreview spriteUri={fishSpriteUri} />}
                    <Typography
                      variant="body1"
                      noWrap
                      sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {item.name}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      ml: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                      <PixelIcon icon={COIN_ICON} color={COIN_COLOR} />
                      <Typography variant="body2">{item.pomoCost}</Typography>
                    </Box>
                    {item.capacityCost !== undefined && (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', color: 'info.light' }}>
                        <PixelIcon icon={FISH_ICON} color={FISH_COLOR} />
                        <Typography variant="body2">{item.capacityCost}</Typography>
                      </Box>
                    )}
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={!canBuy}
                    onClick={() => {
                      if (canBuy) {
                        sendMessage({ type: 'purchaseItem', itemId: item.id });
                      }
                    }}
                    sx={{
                      ml: 1,
                      px: 1,
                      py: '2px',
                      fontSize: '10px',
                      minWidth: 'auto',
                      ...(canBuy
                        ? {
                            borderColor: 'success.main',
                            bgcolor: 'success.dark',
                            color: 'success.light',
                            '&:hover': { borderColor: 'success.main', bgcolor: 'success.dark' },
                          }
                        : {
                            borderColor: '#666',
                            bgcolor: 'action.disabledBackground',
                            color: 'action.disabled',
                          }),
                    }}
                  >
                    {canBuy ? 'Buy' : 'Locked'}
                  </Button>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};
