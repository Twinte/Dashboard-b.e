import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';
import './TripStatusWidget.css';

const TripStatusWidget = () => {
  const [tripStatus, setTripStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTripStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/trip/status`);
        if (res.data) {
          setTripStatus(res.data);
          setError(null);
        }
      } catch (err) {
        setError('Não foi possível carregar status da viagem');
      } finally {
        setLoading(false);
      }
    };

    fetchTripStatus();
    const intervalId = setInterval(fetchTripStatus, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'em andamento':
      case 'in_progress':
        return '#4CAF50';
      case 'completed':
      case 'concluída':
      case 'finished':
        return '#2196F3';
      case 'paused':
      case 'pausada':
        return '#FF9800';
      case 'error':
      case 'falha':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatDate = (date) => {
    if (!date) return '---';
    try {
      return new Date(date).toLocaleString('pt-BR');
    } catch {
      return '---';
    }
  };

  if (loading) {
    return (
      <div className="trip-status-widget loading">
        <span>A carregar status...</span>
      </div>
    );
  }

  if (error || !tripStatus) {
    return (
      <div className="trip-status-widget no-trip">
        <div className="status-icon">🚤</div>
        <span>Nenhuma viagem ativa</span>
      </div>
    );
  }

  return (
    <div className="trip-status-widget">
      <div className="trip-header">
        <span className="trip-label">Viagem</span>
        <span 
          className="trip-status-badge"
          style={{ backgroundColor: getStatusColor(tripStatus.status) }}
        >
          {tripStatus.status || 'Desconhecido'}
        </span>
      </div>
      
      <div className="trip-info">
        {tripStatus.tripId && (
          <div className="trip-field">
            <span className="field-label">ID:</span>
            <span className="field-value">{tripStatus.tripId}</span>
          </div>
        )}
        
        <div className="trip-field">
          <span className="field-label">Início:</span>
          <span className="field-value">{formatDate(tripStatus.startTime)}</span>
        </div>
        
        {tripStatus.endTime && (
          <div className="trip-field">
            <span className="field-label">Fim:</span>
            <span className="field-value">{formatDate(tripStatus.endTime)}</span>
          </div>
        )}
        
        {tripStatus.totalDistance && (
          <div className="trip-field">
            <span className="field-label">Distância:</span>
            <span className="field-value">{tripStatus.totalDistance.toFixed(2)} km</span>
          </div>
        )}
      </div>

      <div className="trip-coordinates">
        {tripStatus.startLatitude && tripStatus.startLongitude && (
          <div className="coord-field">
            <span className="coord-label">Partida:</span>
            <span className="coord-value">
              {tripStatus.startLatitude.toFixed(4)}, {tripStatus.startLongitude.toFixed(4)}
            </span>
          </div>
        )}
        {tripStatus.endLatitude && tripStatus.endLongitude && (
          <div className="coord-field">
            <span className="coord-label">Chegada:</span>
            <span className="coord-value">
              {tripStatus.endLatitude.toFixed(4)}, {tripStatus.endLongitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripStatusWidget;
