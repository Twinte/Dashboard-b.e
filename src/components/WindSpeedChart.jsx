import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { parseISO } from 'date-fns';
import { API_URL } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale);

const WindSpeedChart = () => {
  const [chartData, setChartData] = useState({ datasets: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWindSpeed, setCurrentWindSpeed] = useState(null);

  useEffect(() => {
    const fetchWindData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/weather`);
        const data = response.data;
        if (data && data.hourly && data.hourly.time && data.hourly.windspeed_10m) {
          const labels = data.hourly.time.map(t => parseISO(t));
          const windSpeeds = data.hourly.windspeed_10m;
          const now = new Date();
          let closestIndex = 0;
          let smallestDiff = Infinity;
          labels.forEach((label, index) => {
            const diff = Math.abs(now - label);
            if (diff < smallestDiff) { smallestDiff = diff; closestIndex = index; }
          });
          setCurrentWindSpeed(windSpeeds[closestIndex]);
          setChartData({
            labels: labels,
            datasets: [{
              label: 'Velocidade do Vento (km/h)', data: windSpeeds,
              borderColor: '#3498db', backgroundColor: 'rgba(52, 152, 219, 0.2)',
              fill: true, tension: 0.3, pointRadius: 0,
            }]
          });
        }
        setError(null);
      } catch (_err) { setError('Não foi possível carregar os dados de meteorologia.'); } 
      finally { setLoading(false); }
    };
    fetchWindData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartOptions = {
    maintainAspectRatio: false, responsive: true, animation: { duration: 800 },
    plugins: {
      legend: { labels: { color: '#FFFFFF' } },
      title: { display: true, text: `Vel. Vento Agora: ${currentWindSpeed !== null ? currentWindSpeed.toFixed(1) + ' km/h' : '---'}`, color: '#FFFFFF', font: { size: 16 } },
    },
    scales: {
      x: { type: 'time', time: { unit: 'hour', tooltipFormat: 'dd/MM HH:mm' }, ticks: { color: '#FFFFFF' }, grid: { color: '#3A3A3C' }, },
      y: { ticks: { color: '#FFFFFF' }, grid: { color: '#3A3A3C' }, title: { display: true, text: 'km/h', color: '#8E8E93' } },
    },
  };

  if (loading) return <div className="content-placeholder">A carregar dados do vento...</div>;
  if (error) return <div className="content-placeholder" style={{color: '#e74c3c'}}>{error}</div>;
  return <Line data={chartData} options={chartOptions} />;
};
export default WindSpeedChart;
