import React from 'react';
import MapComponent from './MapComponent';
import MotorTempChart from './MotorTempChart';
import ControlTempChart from './ControlTempChart';
import BatteryStatus from './BatteryStatus';
import SpeedChart from './SpeedChart';
import CurrentChart from './WavesChart';
import Compass from './Compass';
import WindSpeedChart from './WindSpeedChart';
import AutonomiaChart from './AutonomiaChart';
import CapacidadeRestanteChart from './CapacidadeRestanteChart';
import TripStatusWidget from './TripStatusWidget';
import ErrorBoundary from './ErrorBoundary';

const AllCharts = ({ history, latestData, loading }) => {
  const PONTOS_HISTORICO_MINI = 15;
  const miniSlicedHistory = history.slice(-PONTOS_HISTORICO_MINI);
  const allTemps = history.flatMap(h => [h?.Motor_Temp_C, h?.Ctrl_Temp_C]).filter(t => t != null);
  const minTemp = allTemps.length > 0 ? Math.floor(Math.min(...allTemps) - 5) : 0;
  const maxTemp = allTemps.length > 0 ? Math.ceil(Math.max(...allTemps) + 5) : 100;
  
  const itemsToDisplay = [
    { id: 'map', Comp: MapComponent, props: { latitude: latestData?.Latitude, longitude: latestData?.Longitude } },
    { id: 'tripStatus', Comp: TripStatusWidget, props: {} },
    { id: 'battery', Comp: BatteryStatus, props: { percentage: latestData?.Porcentagem_Bateria, voltage: latestData?.Volt, historyData: miniSlicedHistory.map(h => h?.Volt ?? 0), loading } },
    { id: 'autonomia', Comp: AutonomiaChart, props: { currentValue: latestData?.Autonomia, historyData: miniSlicedHistory.map(h => h?.Autonomia ?? 0), loading } },
    { id: 'capacidade', Comp: CapacidadeRestanteChart, props: { currentValue: latestData?.Capacidade_Restante, historyData: miniSlicedHistory.map(h => h?.Capacidade_Restante ?? 0), loading } },
    { id: 'motorTemp', Comp: MotorTempChart, props: { currentTemp: latestData?.Motor_Temp_C, historyData: miniSlicedHistory.map(h => h?.Motor_Temp_C ?? 0), loading, minY: minTemp, maxY: maxTemp } },
    { id: 'controlTemp', Comp: ControlTempChart, props: { currentTemp: latestData?.Ctrl_Temp_C, historyData: miniSlicedHistory.map(h => h?.Ctrl_Temp_C ?? 0), loading, minY: minTemp, maxY: maxTemp } },
    { id: 'speed', Comp: SpeedChart, props: { currentValue: latestData?.Speed_KPH, historyData: miniSlicedHistory.map(h => h?.Speed_KPH ?? 0), title: 'Velocidade (KPH)', loading } },
    { id: 'motorSpeed', Comp: SpeedChart, props: { currentValue: latestData?.Motor_Speed_RPM, historyData: miniSlicedHistory.map(h => h?.Motor_Speed_RPM ?? 0), title: 'Motor (RPM)', loading } },
    { id: 'waves', Comp: CurrentChart, props: { currentValue: latestData?.Current, historyData: miniSlicedHistory.map(h => h?.Current ?? 0), loading } },
    { id: 'windSpeed', Comp: WindSpeedChart, props: { loading } },
    { id: 'compass', Comp: Compass, props: { heading: latestData?.Heading ?? 0, loading } },
  ];

  return (
    <div className="all-charts-container">
      {itemsToDisplay.map(({ id, Comp: Component, props }) => (
        <div key={id} className="grid-item">
          <ErrorBoundary>
            <Component {...props} />
          </ErrorBoundary>
        </div>
      ))}
    </div>
  );
};
export default AllCharts;
