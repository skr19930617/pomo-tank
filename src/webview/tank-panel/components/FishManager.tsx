import React, { useState, useEffect, useRef } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { GameStateSnapshot } from '../../../game/state';
import type { WebviewToExtensionMessage } from '../../../shared/messages';
import { getSpecies } from '../../../game/species';
import { FishPreview } from './FishPreview';
import { useSpriteUriMap } from '../contexts/sprite-context';
import { accordionSx, accordionSummarySx, accordionDetailsSx } from '../theme';

interface FishManagerProps {
  state: GameStateSnapshot;
  sendMessage: (msg: WebviewToExtensionMessage) => void;
}

const HEALTH_COLORS: Record<string, string> = {
  Healthy: '#88cc88',
  Warning: '#cccc44',
  Sick: '#cc8888',
  Dead: '#888888',
};

function formatAge(weeks: number): string {
  if (weeks < 8) return `${weeks}w`;
  const months = Math.floor(weeks / 4.33);
  return `${months}mo`;
}

/** Sub-component for a single fish row with local name editing state */
const FishRow: React.FC<{
  fish: GameStateSnapshot['fish'][number];
  defaultName: string;
  spriteUri: string | undefined;
  isConfirming: boolean;
  onRename: (value: string) => void;
  onRemoveClick: () => void;
  onCancelConfirm: () => void;
}> = ({ fish, defaultName, spriteUri, isConfirming, onRename, onRemoveClick, onCancelConfirm }) => {
  const [localName, setLocalName] = useState(fish.customName ?? '');

  const commitName = () => {
    if (localName !== (fish.customName ?? '')) {
      onRename(localName);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        py: '3px',
        borderBottom: '1px solid',
        borderColor: 'border.dark',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Animated sprite */}
      <FishPreview spriteUri={spriteUri} />

      {/* Name input (fixed width) */}
      <TextField
        size="small"
        value={localName}
        placeholder={defaultName}
        inputProps={{ maxLength: 20 }}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={() => commitName()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
          }
        }}
        sx={{
          width: '80px',
          flexShrink: 0,
          '& .MuiOutlinedInput-root': {
            bgcolor: '#1a1a2e',
            color: 'text.bright',
            fontSize: '9px',
            '& fieldset': { borderColor: 'border.dark' },
            '&:hover fieldset': { borderColor: 'border.main' },
            '& input': { py: '2px', px: '4px' },
          },
        }}
      />

      {/* Stats: age, size */}
      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '8px', flexShrink: 0 }}>
        {formatAge(fish.ageWeeks)}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '8px', flexShrink: 0 }}>
        {Math.round(fish.bodyLengthMm)}mm
      </Typography>

      {/* Health state */}
      <Typography
        variant="body2"
        sx={{
          color: HEALTH_COLORS[fish.healthState] ?? '#888',
          fontSize: '8px',
          flexShrink: 0,
        }}
      >
        {fish.healthState}
      </Typography>

      {/* Spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Remove / Confirm buttons */}
      {isConfirming ? (
        <>
          <Button
            size="small"
            onClick={onRemoveClick}
            sx={{
              fontSize: '8px',
              px: '4px',
              py: '1px',
              minWidth: 'auto',
              border: '1px solid #cc3322',
              color: '#ff6644',
              '&:hover': { bgcolor: 'rgba(204, 51, 34, 0.1)' },
            }}
          >
            OK
          </Button>
          <Button
            size="small"
            onClick={onCancelConfirm}
            sx={{
              fontSize: '8px',
              px: '4px',
              py: '1px',
              minWidth: 'auto',
              borderColor: 'border.main',
              color: 'text.secondary',
            }}
          >
            No
          </Button>
        </>
      ) : (
        <Button
          size="small"
          onClick={onRemoveClick}
          sx={{
            fontSize: '8px',
            px: '4px',
            py: '1px',
            minWidth: 'auto',
            borderColor: 'border.main',
            color: 'text.secondary',
            '&:hover': { color: '#ff6644', borderColor: '#cc3322' },
          }}
        >
          X
        </Button>
      )}
    </Box>
  );
};

export const FishManager: React.FC<FishManagerProps> = ({ state, sendMessage }) => {
  const spriteUriMap = useSpriteUriMap();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (confirmingId) {
      confirmTimer.current = setTimeout(() => {
        setConfirmingId(null);
      }, 3000);
      return () => {
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
      };
    }
  }, [confirmingId]);

  return (
    <Accordion sx={accordionSx}>
      <AccordionSummary
        sx={accordionSummarySx}
        expandIcon={<Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>▼</Typography>}
      >
        <Typography variant="body1">Fish ({state.fish.length})</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ ...accordionDetailsSx, p: '4px' }}>
        {state.fish.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 1 }}>
            No fish in tank
          </Typography>
        ) : (
          state.fish.map((fish) => {
            const species = getSpecies(fish.genusId, fish.speciesId);
            const defaultName = species?.displayName ?? fish.speciesId;
            // Choose sprite based on health: Dead/Sick → weak, else → swim
            const animState =
              fish.healthState === 'Dead' || fish.healthState === 'Sick' ? 'weak' : 'swim';
            const spriteUri =
              spriteUriMap[fish.genusId]?.[fish.speciesId]?.[animState] ??
              spriteUriMap[fish.genusId]?.[fish.speciesId]?.swim;

            return (
              <FishRow
                key={`${fish.id}-${fish.customName ?? ''}`}
                fish={fish}
                defaultName={defaultName}
                spriteUri={spriteUri}
                isConfirming={confirmingId === fish.id}
                onRename={(value) =>
                  sendMessage({ type: 'renameFish', fishId: fish.id, customName: value })
                }
                onRemoveClick={() => {
                  if (confirmingId === fish.id) {
                    setConfirmingId(null);
                    sendMessage({ type: 'removeFish', fishId: fish.id });
                  } else {
                    setConfirmingId(fish.id);
                  }
                }}
                onCancelConfirm={() => setConfirmingId(null)}
              />
            );
          })
        )}
      </AccordionDetails>
    </Accordion>
  );
};
