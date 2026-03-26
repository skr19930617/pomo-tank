import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { UserSettings } from '../../../shared/types';
import { FOCUS_MIN, FOCUS_MAX, BREAK_MIN, BREAK_MAX } from '../../../shared/types';

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onUpdateSetting }) => {
  return (
    <Accordion
      sx={{
        my: '4px',
        bgcolor: 'transparent',
      }}
    >
      <AccordionSummary
        sx={{
          bgcolor: 'background.paper',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: 'border.dark',
          color: 'text.secondary',
          fontSize: '11px',
          userSelect: 'none',
        }}
        expandIcon={<Typography sx={{ color: 'text.secondary', fontSize: '11px' }}>▼</Typography>}
      >
        <Typography variant="body1">Settings</Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          bgcolor: 'background.panel',
          borderRadius: '0 0 4px 4px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: '4px',
          }}
        >
          <Typography variant="body1" sx={{ color: 'text.primary' }}>
            Focus (min)
          </Typography>
          <TextField
            type="number"
            value={settings.focusMinutes}
            inputProps={{ min: FOCUS_MIN, max: FOCUS_MAX }}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                onUpdateSetting('focusMinutes', Math.max(FOCUS_MIN, Math.min(FOCUS_MAX, val)));
              }
            }}
            sx={{
              width: '60px',
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1a1a2e',
                color: 'text.bright',
                fontSize: '11px',
                '& fieldset': { borderColor: 'border.main' },
                '&:hover fieldset': { borderColor: 'border.main' },
                '& input': { textAlign: 'center', py: '2px', px: '4px' },
              },
            }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: '4px',
          }}
        >
          <Typography variant="body1" sx={{ color: 'text.primary' }}>
            Break (min)
          </Typography>
          <TextField
            type="number"
            value={settings.breakMinutes}
            inputProps={{ min: BREAK_MIN, max: BREAK_MAX }}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                onUpdateSetting('breakMinutes', Math.max(BREAK_MIN, Math.min(BREAK_MAX, val)));
              }
            }}
            sx={{
              width: '60px',
              '& .MuiOutlinedInput-root': {
                bgcolor: '#1a1a2e',
                color: 'text.bright',
                fontSize: '11px',
                '& fieldset': { borderColor: 'border.main' },
                '&:hover fieldset': { borderColor: 'border.main' },
                '& input': { textAlign: 'center', py: '2px', px: '4px' },
              },
            }}
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};
