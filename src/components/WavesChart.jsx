import React from 'react';
import ChartComponent from './ChartComponent';

const CurrentChart = ({ currentValue, historyData, loading }) => {
  const chartOptions = {
    title: `Corrente: ${(!loading && currentValue != null) ? currentValue.toFixed(2) + ' A' : '---'}`,
    label: 'Corrente (A)',
    datasetOptions: { borderColor: '#9b59b6', backgroundColor: 'rgba(155, 89, 182, 0.3)', fill: true },
  };
  return <ChartComponent data={historyData} options={chartOptions} loading={loading} />;
};
export default CurrentChart;