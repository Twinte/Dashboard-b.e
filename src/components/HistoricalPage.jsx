import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { parseISO, format, isValid, startOfDay, endOfDay } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, TimeScale);

// Componente da Tabela de Dados com Paginação
const DataTable = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 10;
  
  useEffect(() => {
    // Reseta para a primeira página sempre que os dados do filtro mudam
    setCurrentPage(0);
  }, [data]);

  const pageCount = Math.ceil(data.length / rowsPerPage);
  const paginatedData = data.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  const goToPage = (page) => {
    setCurrentPage(Math.max(0, Math.min(page, pageCount - 1)));
  };

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Volt (V)</th>
            <th>Velocidade (KPH)</th>
            <th>Motor (RPM)</th>
            <th>Temp. Motor (°C)</th>
            <th>Temp. Controle (°C)</th>
            <th>Corrente (A)</th>
            <th>Autonomia (km)</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row) => (
            <tr key={row._id}>
              <td>{isValid(parseISO(row.Timestamp)) ? format(parseISO(row.Timestamp), 'dd/MM/yy HH:mm:ss') : 'Data inválida'}</td>
              <td>{row.Volt?.toFixed(2)}</td>
              <td>{row.Speed_KPH}</td>
              <td>{row.Motor_Speed_RPM}</td>
              <td>{row.Motor_Temp_C}</td>
              <td>{row.Ctrl_Temp_C}</td>
              <td>{row.Current?.toFixed(2)}</td>
              <td>{row.Autonomia?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pageCount > 1 && (
        <div className="pagination">
          <button onClick={() => goToPage(0)} disabled={currentPage === 0}>Primeira</button>
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}>Anterior</button>
          <span>Página {currentPage + 1} de {pageCount}</span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pageCount - 1}>Próxima</button>
          <button onClick={() => goToPage(pageCount - 1)} disabled={currentPage >= pageCount - 1}>Última</button>
        </div>
      )}
    </div>
  );
};

const HistoricalPage = () => {
  const [fullHistory, setFullHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [selectedVariable, setSelectedVariable] = useState('Volt');
  
  const variableOptions = {
    'Volt': { label: 'Voltagem', unit: 'V' },
    'Speed_KPH': { label: 'Velocidade', unit: 'KPH' },
    'Motor_Speed_RPM': { label: 'Motor', unit: 'RPM' },
    'Motor_Temp_C': { label: 'Temp. Motor', unit: '°C' },
    'Ctrl_Temp_C': { label: 'Temp. Controle', unit: '°C' },
    'Current': { label: 'Corrente', unit: 'A' },
    'Autonomia': { label: 'Autonomia', unit: 'km' },
  };

  useEffect(() => {
    const fetchFullHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/dados/completo`);
        if (res.data && Array.isArray(res.data)) {
          setFullHistory(res.data);
          if (res.data.length > 0) {
            const firstDate = parseISO(res.data[0].Timestamp);
            const lastDate = parseISO(res.data[res.data.length - 1].Timestamp);
            if (isValid(firstDate) && isValid(lastDate)) {
              setStartDate(format(firstDate, 'yyyy-MM-dd'));
              setEndDate(format(lastDate, 'yyyy-MM-dd'));
            }
          }
        }
      } catch (err) {
        setError("Não foi possível carregar o histórico completo.");
        console.error("Erro ao buscar histórico completo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) {
      setFilteredData(fullHistory);
      return;
    }
    try {
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));
      const data = fullHistory.filter(d => {
        const currentDate = parseISO(d.Timestamp);
        return isValid(currentDate) && currentDate >= start && currentDate <= end;
      });
      setFilteredData(data);
    } catch (error) { console.error("Erro ao filtrar datas:", error); }
  }, [startDate, endDate, fullHistory]);

  const summaryMetrics = useMemo(() => {
    if (filteredData.length < 2) return { distance: 0, energy: 0, time: '0h 0m' };
    let distance = 0, energy = 0;
    for (let i = 1; i < filteredData.length; i++) {
        const prev = filteredData[i-1], curr = filteredData[i];
        if (!prev.Timestamp || !curr.Timestamp) continue;
        const timeDiffHours = (parseISO(curr.Timestamp) - parseISO(prev.Timestamp)) / 3600000;
        distance += (curr.Speed_KPH || 0) * timeDiffHours;
        energy += (curr.Volt || 0) * (curr.Current || 0) * timeDiffHours / 1000;
    }
    const totalTimeMinutes = (parseISO(filteredData[filteredData.length - 1].Timestamp) - parseISO(filteredData[0].Timestamp)) / 60000;
    const hours = Math.floor(totalTimeMinutes / 60);
    const minutes = Math.round(totalTimeMinutes % 60);
    return { distance: distance.toFixed(1), energy: energy.toFixed(2), time: `${hours}h ${minutes}m` };
  }, [filteredData]);
  
  const chartData = {
    labels: filteredData.map(d => d.Timestamp),
    datasets: [{
      label: variableOptions[selectedVariable].label, data: filteredData.map(d => d[selectedVariable]),
      borderColor: 'var(--accent-primary)', backgroundColor: 'rgba(0, 167, 157, 0.2)',
      fill: true, tension: 0.3, pointRadius: 2,
    }]
  };
  const chartOptions = {
    maintainAspectRatio: false, responsive: true,
    scales: {
      x: { type: 'time', time: { unit: 'day', tooltipFormat: 'dd/MM/yyyy HH:mm' }, ticks: { color: '#FFFFFF' }, grid: { color: 'var(--border-color)' } },
      y: { ticks: { color: '#FFFFFF' }, grid: { color: 'var(--border-color)' }, title: { display: true, text: variableOptions[selectedVariable].unit, color: 'var(--text-secondary)' } }
    },
    plugins: {
      legend: { labels: { color: '#FFFFFF' } },
      tooltip: { backgroundColor: 'var(--bg-panel)', titleColor: 'var(--text-primary)', bodyColor: 'var(--text-primary)'}
    }
  };

  if (loading) return <div className="content-placeholder">A carregar histórico completo...</div>;
  if (error) return <div className="content-placeholder" style={{color: 'red'}}>{error}</div>;

  return (
    <div className="historical-page-container">
      <div className="historical-controls-bar">
        <div className="historical-header">
          <h1 className="historical-title">Histórico de Viagem</h1>
          <div className="date-range-picker-container">
            <label htmlFor="start-date">De:</label>
            <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <label htmlFor="end-date">Até:</label>
            <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="historical-summary-and-controls">
          <div className="summary-metrics-group">
            <div className="metric-item">
              <span className="metric-item-title">DISTÂNCIA TOTAL</span>
              <span className="metric-item-value">{summaryMetrics.distance} km</span>
            </div>
            <div className="metric-item">
              <span className="metric-item-title">ENERGIA CONSUMIDA</span>
              <span className="metric-item-value">{summaryMetrics.energy} kWh</span>
            </div>
            <div className="metric-item">
              <span className="metric-item-title">TEMPO DE VIAGEM</span>
              <span className="metric-item-value">{summaryMetrics.time}</span>
            </div>
          </div>
          <div className="chart-controls">
            <label htmlFor="variable-select">Visualizar:</label>
            <select id="variable-select" value={selectedVariable} onChange={e => setSelectedVariable(e.target.value)}>
              {Object.keys(variableOptions).map(key => <option key={key} value={key}>{variableOptions[key].label}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <div className="historical-chart-container">
        <div style={{flexGrow: 1}}>
          {filteredData.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="content-placeholder">Sem dados para o período ou filtros selecionados.</div>
          )}
        </div>
      </div>

      <DataTable data={filteredData} />
    </div>
  );
};

export default HistoricalPage;
