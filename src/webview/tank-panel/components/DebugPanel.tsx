import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

interface DebugPanelProps {
  pomoBalance: number;
  onSetPomo: (amount: number) => void;
  onResetState: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ pomoBalance, onSetPomo, onResetState }) => {
  const [pomoInput, setPomoInput] = useState(String(pomoBalance));
  const [confirmingReset, setConfirmingReset] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPomoInput(String(pomoBalance));
  }, [pomoBalance]);

  useEffect(() => {
    if (confirmingReset) {
      confirmTimer.current = setTimeout(() => {
        setConfirmingReset(false);
      }, 3000);
      return () => {
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
      };
    }
  }, [confirmingReset]);

  const handleSetPomo = () => {
    const val = parseInt(pomoInput, 10);
    if (!isNaN(val)) {
      onSetPomo(Math.max(0, val));
    }
  };

  const handleResetClick = () => {
    if (confirmingReset) {
      setConfirmingReset(false);
      onResetState();
    } else {
      setConfirmingReset(true);
    }
  };

  return (
    <Box
      sx={{
        border: '2px solid',
        borderColor: 'debug.main',
        borderRadius: '4px',
        p: '6px 8px',
        m: '4px',
        bgcolor: 'debug.dark',
        fontSize: '11px',
        color: 'debug.light',
      }}
    >
      <Typography
        sx={{
          fontWeight: 'bold',
          color: 'debug.main',
          mb: '4px',
          fontSize: '10px',
        }}
      >
        DEBUG MODE
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '4px' }}>
        <Typography variant="body1" sx={{ color: 'debug.light' }}>
          Pomo:
        </Typography>
        <TextField
          type="number"
          value={pomoInput}
          onChange={(e) => setPomoInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSetPomo()}
          inputProps={{ min: 0 }}
          sx={{
            width: '60px',
            '& .MuiOutlinedInput-root': {
              bgcolor: '#1a0f08',
              color: 'debug.light',
              fontSize: '11px',
              '& fieldset': { borderColor: '#664422' },
              '&:hover fieldset': { borderColor: '#664422' },
              '& input': { py: '2px', px: '4px' },
            },
          }}
        />
        <Button
          onClick={handleSetPomo}
          sx={{
            px: 1,
            py: '2px',
            fontSize: '10px',
            minWidth: 'auto',
            border: '1px solid #664422',
            borderRadius: '2px',
            bgcolor: '#3a2210',
            color: 'debug.light',
            '&:hover': { bgcolor: '#4a3220' },
          }}
        >
          Set
        </Button>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Button
          onClick={handleResetClick}
          sx={{
            px: 1,
            py: '2px',
            fontSize: '10px',
            minWidth: 'auto',
            borderRadius: '2px',
            bgcolor: '#3a2210',
            ...(confirmingReset
              ? {
                  border: '1px solid #cc3322',
                  color: '#ff6644',
                }
              : {
                  border: '1px solid #664422',
                  color: 'debug.light',
                }),
            '&:hover': { bgcolor: '#4a3220' },
          }}
        >
          {confirmingReset ? 'Confirm Reset?' : 'Reset State'}
        </Button>
        {confirmingReset && (
          <Button
            onClick={() => setConfirmingReset(false)}
            sx={{
              px: 1,
              py: '2px',
              fontSize: '10px',
              minWidth: 'auto',
              border: '1px solid #664422',
              borderRadius: '2px',
              bgcolor: '#3a2210',
              color: 'debug.light',
              '&:hover': { bgcolor: '#4a3220' },
            }}
          >
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
};
