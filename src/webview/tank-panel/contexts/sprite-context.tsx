import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SpriteUriMap } from '../../../shared/sprite-utils';
import type { ExtensionToWebviewMessage } from '../../../shared/messages';

const SpriteUriMapContext = createContext<SpriteUriMap>({});

interface SpriteUriMapProviderProps {
  children: React.ReactNode;
}

export function SpriteUriMapProvider({ children }: SpriteUriMapProviderProps) {
  const [spriteUriMap, setSpriteUriMap] = useState<SpriteUriMap>({});

  useEffect(() => {
    const handler = (event: MessageEvent<ExtensionToWebviewMessage>) => {
      const msg = event.data;
      if (msg.type === 'spriteUriMap') {
        setSpriteUriMap(msg.spriteUriMap);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return (
    <SpriteUriMapContext.Provider value={spriteUriMap}>
      {children}
    </SpriteUriMapContext.Provider>
  );
}

export function useSpriteUriMap(): SpriteUriMap {
  return useContext(SpriteUriMapContext);
}
