import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { GameStateSnapshot } from '../../../game/state';
import type { WebviewToExtensionMessage } from '../../../shared/messages';
import { getFilter, getAllFilters } from '../../../game/filters';
import { getTank, getAllTanks } from '../../../game/tanks';
import { accordionSx, accordionSummarySx, accordionDetailsSx } from '../theme';

interface TankManagerProps {
  state: GameStateSnapshot;
  sendMessage: (msg: WebviewToExtensionMessage) => void;
}

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

  const allTanks = getAllTanks();
  const availableTanks = allTanks.filter((tank) => {
    if (tank.pomoCost === 0) return true; // Starter tank always available
    return unlockedItems.includes(tank.id);
  });

  const allFilters = getAllFilters();
  const availableFilters = allFilters.filter((f) => {
    if (f.id === 'basic_sponge') return true;
    return unlockedItems.includes(f.id);
  });

  return (
    <>
      {/* Tank Size Accordion */}
      <Accordion sx={accordionSx}>
        <AccordionSummary
          sx={accordionSummarySx}
          expandIcon={<Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>▼</Typography>}
        >
          <Typography variant="body1">Tank</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {availableTanks.map((tank) => {
              const isActive = state.tank.tankId === tank.id;
              const newMax = tank.baseCapacity + currentFilterBonus;
              const wouldExceed = currentCost > newMax;
              return (
                <Button
                  key={tank.id}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  disabled={isActive || wouldExceed}
                  onClick={() => sendMessage({ type: 'switchTank', tankId: tank.id })}
                  sx={optionButtonSx(isActive, wouldExceed)}
                >
                  {tank.displayName} ({tank.baseCapacity})
                </Button>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Filter Accordion */}
      <Accordion sx={accordionSx}>
        <AccordionSummary
          sx={accordionSummarySx}
          expandIcon={<Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>▼</Typography>}
        >
          <Typography variant="body1">Filter</Typography>
        </AccordionSummary>
        <AccordionDetails sx={accordionDetailsSx}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {availableFilters.map((filter) => {
              const isActive = state.tank.filterId === filter.id;
              const currentTank = getTank(state.tank.tankId);
              const baseCap = currentTank?.baseCapacity ?? 0;
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
