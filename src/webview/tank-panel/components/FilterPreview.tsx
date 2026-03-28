import React from 'react';
import Box from '@mui/material/Box';
import type { FilterId } from '../../../shared/types';
import { getFilter } from '../../../game/filters';

const PREVIEW_SIZE = 32;

interface FilterPreviewProps {
  filterId: FilterId;
}

/**
 * Renders a small pixel-art preview of a filter for display in the store.
 * Uses simple colored boxes matching the filter's visual properties.
 */
export const FilterPreview: React.FC<FilterPreviewProps> = ({ filterId }) => {
  const filter = getFilter(filterId);
  if (!filter) return null;

  const { primaryColor, accentColor, width, height } = filter.visual;
  // Scale filter visual to fit in the preview box
  const scale = Math.min(PREVIEW_SIZE / width, PREVIEW_SIZE / height) * 0.7;
  const sw = Math.round(width * scale);
  const sh = Math.round(height * scale);

  if (filter.mount === 'internal') {
    // Sponge: simple rectangle with accent stripes
    return (
      <Box
        sx={{
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: '6px',
          flexShrink: 0,
        }}
      >
        <Box sx={{ position: 'relative', width: sw, height: sh }}>
          <Box sx={{ width: '100%', height: '100%', bgcolor: primaryColor, borderRadius: '1px' }} />
          <Box
            sx={{
              position: 'absolute',
              top: '20%',
              left: '15%',
              width: '70%',
              height: '2px',
              bgcolor: accentColor,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '20%',
              left: '15%',
              width: '70%',
              height: '2px',
              bgcolor: accentColor,
            }}
          />
        </Box>
      </Box>
    );
  }

  if (filter.mount === 'hang_on_back') {
    // HOB: box with a hanging intake bar
    return (
      <Box
        sx={{
          width: PREVIEW_SIZE,
          height: PREVIEW_SIZE,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: '6px',
          flexShrink: 0,
        }}
      >
        <Box sx={{ position: 'relative', width: sw, height: sh }}>
          <Box sx={{ width: '100%', height: '55%', bgcolor: primaryColor, borderRadius: '1px' }} />
          <Box
            sx={{
              width: '70%',
              height: '45%',
              bgcolor: accentColor,
              mx: 'auto',
              borderRadius: '0 0 1px 1px',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '3px',
              height: '3px',
              bgcolor: accentColor,
            }}
          />
        </Box>
      </Box>
    );
  }

  // Canister: cylinder with cap highlights
  return (
    <Box
      sx={{
        width: PREVIEW_SIZE,
        height: PREVIEW_SIZE,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: '6px',
        flexShrink: 0,
      }}
    >
      <Box sx={{ position: 'relative', width: sw, height: sh }}>
        <Box sx={{ width: '100%', height: '100%', bgcolor: primaryColor, borderRadius: '2px' }} />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '-1px',
            width: 'calc(100% + 2px)',
            height: '3px',
            bgcolor: accentColor,
            borderRadius: '1px 1px 0 0',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: '-1px',
            width: 'calc(100% + 2px)',
            height: '3px',
            bgcolor: accentColor,
            borderRadius: '0 0 1px 1px',
          }}
        />
        {/* Tubes */}
        <Box
          sx={{
            position: 'absolute',
            top: '-4px',
            left: '20%',
            width: '2px',
            height: '4px',
            bgcolor: accentColor,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '-4px',
            right: '20%',
            width: '2px',
            height: '4px',
            bgcolor: primaryColor,
          }}
        />
      </Box>
    </Box>
  );
};
