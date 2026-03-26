import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { GameStateSnapshot } from '../../../game/state';
import type { WebviewToExtensionMessage } from '../../../shared/messages';
import { TankSizeTier, TANK_BASE_CAPACITY, TANK_SIZE_ORDER } from '../../../shared/types';
import { getFilter, getAllFilters } from '../../../game/filters';

interface TankManagerProps {
  state: GameStateSnapshot;
  sendMessage: (msg: WebviewToExtensionMessage) => void;
}

const TANK_ITEM_MAP: Record<string, TankSizeTier> = {
  tank_small: TankSizeTier.Small,
  tank_medium: TankSizeTier.Medium,
  tank_large: TankSizeTier.Large,
  tank_xl: TankSizeTier.XL,
};

const accordionSummarySx = {
  bgcolor: 'background.paper',
  borderRadius: '4px',
  border: '1px solid',
  borderColor: 'border.dark',
  color: 'text.secondary',
  fontSize: '11px',
  userSelect: 'none',
} as const;

const optionButtonSx = (isActive: boolean, wouldExceed: boolean) => ({
  fontSize: '9px',
  px: '6px',
  py: '2px',
  minWidth: 'auto',
  ...(isActive
    ? { bgcolor: 'success.dark', color: 'success.light', borderColor: 'success.main' }
    : wouldExceed
      ? { borderColor: '#666', color: 'action.disabled' }
      : { borderColor: 'border.main', color: 'text.primary' }),
  '&:hover': isActive ? {} : { borderColor: 'border.main', bgcolor: 'background.paper' },
});

export const TankManager: React.FC<TankManagerProps> = ({ state, sendMessage }) => {
  const { unlockedItems } = state.player;
  const currentFilterBonus = getFilter(state.tank.filterId)?.capacityBonus ?? 0;
  const currentCost = state.capacity.current;

  const availableSizes = TANK_SIZE_ORDER.filter((tier) => {
    if (tier === TankSizeTier.Nano) return true;
    return Object.entries(TANK_ITEM_MAP).some(
      ([itemId, t]) => t === tier && unlockedItems.includes(itemId),
    );
  });

  const allFilters = getAllFilters();
  const availableFilters = allFilters.filter((f) => {
    if (f.id === 'basic_sponge') return true;
    return unlockedItems.includes(f.id);
  });

  return (
    <>
      {/* Tank Size Accordion */}
      <Accordion sx={{ my: '4px', bgcolor: 'transparent' }}>
        <AccordionSummary
          sx={accordionSummarySx}
          expandIcon={<Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>▼</Typography>}
        >
          <Typography variant="body1">Tank</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ bgcolor: 'background.panel', borderRadius: '0 0 4px 4px' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {availableSizes.map((tier) => {
              const isActive = state.tank.sizeTier === tier;
              const baseCap = TANK_BASE_CAPACITY[tier];
              const newMax = baseCap + currentFilterBonus;
              const wouldExceed = currentCost > newMax;
              return (
                <Button
                  key={tier}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  disabled={isActive || wouldExceed}
                  onClick={() => sendMessage({ type: 'switchTank', sizeTier: tier })}
                  sx={optionButtonSx(isActive, wouldExceed)}
                >
                  {tier} ({baseCap})
                </Button>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Filter Accordion */}
      <Accordion sx={{ my: '4px', bgcolor: 'transparent' }}>
        <AccordionSummary
          sx={accordionSummarySx}
          expandIcon={<Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>▼</Typography>}
        >
          <Typography variant="body1">Filter</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ bgcolor: 'background.panel', borderRadius: '0 0 4px 4px' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {availableFilters.map((filter) => {
              const isActive = state.tank.filterId === filter.id;
              const baseCap = TANK_BASE_CAPACITY[state.tank.sizeTier];
              const newMax = baseCap + filter.capacityBonus;
              const wouldExceed = currentCost > newMax;
              return (
                <Button
                  key={filter.id}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  disabled={isActive || wouldExceed}
                  onClick={() => sendMessage({ type: 'switchFilter', filterId: filter.id })}
                  sx={optionButtonSx(isActive, wouldExceed)}
                >
                  {filter.displayName} (+{filter.capacityBonus})
                </Button>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
};
