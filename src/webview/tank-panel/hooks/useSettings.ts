import { useState, useEffect, useCallback } from 'react';
import type { UserSettings } from '../../../shared/types';
import { DEFAULT_USER_SETTINGS } from '../../../shared/types';
import type { ExtensionToWebviewMessage, WebviewToExtensionMessage } from '../../../shared/messages';

export interface UseSettingsResult {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
}

export function useSettings(
  sendMessage: (msg: WebviewToExtensionMessage) => void,
): UseSettingsResult {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  useEffect(() => {
    const handler = (event: MessageEvent<ExtensionToWebviewMessage>) => {
      if (event.data.type === 'settingsUpdate') {
        setSettings(event.data.settings);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
      sendMessage({ type: 'updateSettings', settings: { [key]: value } });
    },
    [sendMessage],
  );

  return { settings, updateSetting };
}
