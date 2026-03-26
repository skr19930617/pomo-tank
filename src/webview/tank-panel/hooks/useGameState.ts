import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameStateSnapshot } from '../../../game/state';
import type {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from '../../../shared/messages';
import type { SpriteUriMap } from './useSpriteLoader';

// Acquire the VS Code API once at module level
interface VsCodeApi {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

export interface UseGameStateResult {
  state: GameStateSnapshot | null;
  notification: string | null;
  sendMessage: (msg: WebviewToExtensionMessage) => void;
  spriteUriMap: SpriteUriMap | null;
  feedingActive: boolean;
}

// Read sprite URI map from global set by extension host
function getSpriteUriMap(): SpriteUriMap | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).__SPRITE_URI_MAP__ ?? null;
}

export function useGameState(): UseGameStateResult {
  const [state, setState] = useState<GameStateSnapshot | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [feedingActive, setFeedingActive] = useState(false);
  const notificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spriteUriMap] = useState<SpriteUriMap | null>(() => getSpriteUriMap());

  const showNotification = useCallback((text: string) => {
    setNotification(text);
    if (notificationTimer.current) {
      clearTimeout(notificationTimer.current);
    }
    notificationTimer.current = setTimeout(() => {
      setNotification(null);
      notificationTimer.current = null;
    }, 3000);
  }, []);

  const sendMessage = useCallback((msg: WebviewToExtensionMessage) => {
    vscode.postMessage(msg);
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent<ExtensionToWebviewMessage>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'stateUpdate':
          setState(msg.state);
          break;
        case 'actionResult':
          showNotification(msg.success ? `${msg.action} done!` : `${msg.action} failed`);
          if (msg.success && msg.action === 'Feed Fish') {
            setFeedingActive(true);
            if (feedingTimer.current) clearTimeout(feedingTimer.current);
            feedingTimer.current = setTimeout(() => {
              setFeedingActive(false);
              feedingTimer.current = null;
            }, 1500);
          }
          break;
        case 'purchaseResult':
          showNotification(
            msg.success ? `Purchased ${msg.itemId}!` : (msg.message ?? `Cannot buy ${msg.itemId}`),
          );
          break;
        case 'lightToggleResult':
          showNotification(
            msg.success ? `Light ${msg.lightOn ? 'on' : 'off'}` : 'Light toggle failed',
          );
          break;
        case 'managementResult':
          if (!msg.success) {
            showNotification(msg.message ?? `${msg.action} failed`);
          }
          break;
      }
    };

    window.addEventListener('message', handler);

    // Tell extension we are ready
    sendMessage({ type: 'ready' });

    return () => {
      window.removeEventListener('message', handler);
      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
      }
    };
  }, [sendMessage, showNotification]);

  return { state, notification, sendMessage, spriteUriMap, feedingActive };
}
