import React from 'react';
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

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingTop: '20px',
  zIndex: 10,
  overflowY: 'auto',
};

const sectionStyle: React.CSSProperties = {
  width: '90%',
  maxWidth: '400px',
  marginBottom: '12px',
};

const headingStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#aabbcc',
  borderBottom: '1px solid #444',
  paddingBottom: '4px',
  marginBottom: '6px',
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
  fontSize: '11px',
  color: '#cccccc',
};

const buyBtnStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: '10px',
  cursor: 'pointer',
  border: '1px solid #448844',
  borderRadius: '3px',
  background: '#2a4a2a',
  color: '#aaddaa',
};

const lockedBtnStyle: React.CSSProperties = {
  ...buyBtnStyle,
  border: '1px solid #666',
  background: '#333',
  color: '#777',
  cursor: 'default',
};

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

const closeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  padding: '4px 10px',
  fontSize: '12px',
  cursor: 'pointer',
  border: '1px solid #555',
  borderRadius: '3px',
  background: '#333344',
  color: '#ccccdd',
};

export const Store: React.FC<StoreProps> = ({ items, sendMessage, visible, onClose }) => {
  if (!visible) return null;

  const grouped = new Map<StoreItemType, typeof items>();
  for (const item of items) {
    const group = grouped.get(item.type) ?? [];
    group.push(item);
    grouped.set(item.type, group);
  }

  return (
    <div style={overlayStyle}>
      <button style={closeBtnStyle} onClick={onClose}>
        X
      </button>
      <div style={{ fontSize: '16px', color: '#eeeeff', marginBottom: '12px' }}>Store</div>
      {SECTION_ORDER.map((type) => {
        const sectionItems = grouped.get(type);
        if (!sectionItems || sectionItems.length === 0) return null;
        return (
          <div key={type} style={sectionStyle}>
            <div style={headingStyle}>{SECTION_LABELS[type]}</div>
            {sectionItems.map((item) => {
              const canBuy = item.affordable && item.meetsPrerequisites;
              // Parse fish species ID for sprite preview (format: "genusId:speciesId")
              let fishSpriteUri: string | undefined;
              if (item.type === StoreItemType.FishSpecies && item.id.includes(':')) {
                const [genusId, speciesId] = item.id.split(':');
                fishSpriteUri = spriteUriMap[genusId]?.[speciesId]?.swim;
              }
              return (
                <div key={item.id} style={itemRowStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                    {fishSpriteUri && <FishPreview spriteUri={fishSpriteUri} />}
                    <span
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.name}
                    </span>
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginLeft: '8px',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <PixelIcon icon={COIN_ICON} color={COIN_COLOR} />
                      <span>{item.pomoCost}</span>
                    </span>
                    {item.capacityCost !== undefined && (
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', color: '#88aacc' }}
                      >
                        <PixelIcon icon={FISH_ICON} color={FISH_COLOR} />
                        <span>{item.capacityCost}</span>
                      </span>
                    )}
                  </span>
                  <button
                    style={{ ...(canBuy ? buyBtnStyle : lockedBtnStyle) }}
                    disabled={!canBuy}
                    onClick={() => {
                      if (canBuy) {
                        sendMessage({ type: 'purchaseItem', itemId: item.id });
                      }
                    }}
                  >
                    {canBuy ? 'Buy' : 'Locked'}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
