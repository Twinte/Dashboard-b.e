import React, { createContext, useContext, useState, useEffect } from 'react';

const ConfigContext = createContext();

const DEFAULT_SETTINGS = {
  refreshRate: 5,
  lowBatteryAlert: true,
  lowBatteryThreshold: 20,
  highMotorTempAlert: true,
  highMotorTempThreshold: 90,
  language: 'pt-br',
};

export const ConfigProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('barco_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('barco_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <ConfigContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
