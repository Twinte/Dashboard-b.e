import React from 'react';
import { useConfig } from '../context/ConfigContext';

const ToggleSwitch = ({ id, checked, onChange }) => {
  return (
    <label htmlFor={id} className="toggle-switch">
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="slider"></span>
    </label>
  );
};

const ConfigPage = () => {
  const { settings, updateSettings } = useConfig();

  const handleToggleChange = (key) => {
    updateSettings({ [key]: !settings[key] });
  };

  const handleValueChange = (key, value) => {
    const numericValue = !isNaN(parseFloat(value)) ? parseFloat(value) : value;
    updateSettings({ [key]: numericValue });
  };

  const saveSettings = () => {
    console.log("Configurações salvas:", settings);
    alert('Configurações salvas!');
  };

  return (
    <div className="config-page-container">
      <h1 style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Configurações</h1>

      {/* Seção de Configurações Gerais */}
      <section className="config-section">
        <h2 className="config-section-title">Geral</h2>
        <div className="config-option">
          <div className="config-option-label">
            <strong>Idioma</strong>
            <span>Mude o idioma da interface.</span>
          </div>
          <div className="config-option-control">
            <select
              value={settings.language}
              onChange={(e) => handleValueChange('language', e.target.value)}
            >
              <option value="pt-br">Português (Brasil)</option>
              <option value="en-us">English (US)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Seção de Alertas */}
      <section className="config-section">
        <h2 className="config-section-title">Alertas e Notificações</h2>
        <div className="config-option">
          <div className="config-option-label">
            <strong>Alerta de Bateria Baixa</strong>
            <span>Receba uma notificação quando a bateria estiver abaixo do limiar.</span>
          </div>
          <div className="config-option-control" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input
              type="number"
              value={settings.lowBatteryThreshold}
              onChange={(e) => handleValueChange('lowBatteryThreshold', e.target.value)}
              style={{ width: '60px' }}
              disabled={!settings.lowBatteryAlert}
            />
            <span>%</span>
            <ToggleSwitch id="low-battery-toggle" checked={settings.lowBatteryAlert} onChange={() => handleToggleChange('lowBatteryAlert')} />
          </div>
        </div>
        <div className="config-option">
          <div className="config-option-label">
            <strong>Alerta de Temperatura Alta do Motor</strong>
            <span>Receba uma notificação quando a temperatura exceder o limiar.</span>
          </div>
          <div className="config-option-control" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input
              type="number"
              value={settings.highMotorTempThreshold}
              onChange={(e) => handleValueChange('highMotorTempThreshold', e.target.value)}
              style={{ width: '60px' }}
              disabled={!settings.highMotorTempAlert}
            />
            <span>°C</span>
            <ToggleSwitch id="high-temp-toggle" checked={settings.highMotorTempAlert} onChange={() => handleToggleChange('highMotorTempAlert')} />
          </div>
        </div>
      </section>

       {/* Seção de Dados */}
       <section className="config-section">
        <h2 className="config-section-title">Dados e Atualização</h2>
        <div className="config-option">
          <div className="config-option-label">
            <strong>Frequência de Atualização</strong>
            <span>Intervalo em que os dados do dashboard são atualizados.</span>
          </div>
          <div className="config-option-control">
            <select
              value={settings.refreshRate}
              onChange={(e) => handleValueChange('refreshRate', e.target.value)}
            >
              <option value={2}>2 segundos</option>
              <option value={5}>5 segundos (Padrão)</option>
              <option value={10}>10 segundos</option>
              <option value={30}>30 segundos</option>
            </select>
          </div>
        </div>
      </section>

      <button className="menu-button-base active config-save-btn" onClick={saveSettings}>
        Salvar Alterações
      </button>
    </div>
  );
};

export default ConfigPage;
