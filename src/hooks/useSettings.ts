import { useState, useCallback } from 'react';

interface UseSettingsReturn {
  settings: Record<string, any>;
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  saveSettings: (newSettings: Record<string, any>) => Promise<void>;
  updateSetting: (key: string, value: any) => void;
  resetSettings: () => void;
  clearError: () => void;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      // Temporarily disabled until integration_settings table is created
      setSettings({});
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: Record<string, any>) => {
    try {
      setLoading(true);
      // Temporarily disabled until integration_settings table is created
      setSettings(newSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({});
    setError(null);
  }, []);

  return {
    settings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateSetting,
    resetSettings,
    clearError
  };
};

export default useSettings;