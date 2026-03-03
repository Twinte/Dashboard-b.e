import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine'; // Importando o leaflet-routing-machine

const MiniMap = ({ id, position, zoom, routePoints, info }) => {
  const mapRef = useRef(null); // Usando useRef para manter a instância do mapa
  const containerId = `mini-map-${id}`;

  useEffect(() => {
    // Verifica se o mapa já foi inicializado
    if (mapRef.current) return;

    // Inicializa o mapa apenas uma vez
    const map = L.map(containerId, {
      center: position,    // Define o centro inicial
      zoom: zoom,          // Define o zoom inicial
      attributionControl: false,  // Desativa o controle de atribuição
      zoomControl: false,         // Desativa o controle de zoom
      dragging: false,            // Desativa o arraste do mapa
      touchZoom: false,           // Desativa o zoom por toque
      scrollWheelZoom: true,     // Desativa o zoom com a rotação do mouse
      doubleClickZoom: false,     // Desativa o zoom com o duplo clique
    });

    mapRef.current = map;  // Armazena a instância do mapa

    // Adiciona os tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Se houver rota e pontos suficientes, desenha a rota
    if (routePoints && routePoints.length > 1) {
      L.Routing.control({
        waypoints: routePoints.map((point) => L.latLng(point[0], point[1])),
        routeWhileDragging: false, // Não permite arrastar a rota enquanto é desenhada
        addWaypoints: false,       // Não permite adicionar novos pontos à rota
      }).addTo(map);
    }

    // Evita qualquer tipo de atualização automática, como ajuste de zoom e posição
    map.setView(position, zoom);

    return () => {
      map.remove();  // Limpeza do mapa quando o componente for desmontado
      mapRef.current = null;  // Resetando a referência
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, zoom, routePoints]);  // O mapa será reconstruído apenas se a posição, zoom ou rota mudar

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      {/* Informações à esquerda */}
      <div style={{ flex: 1, paddingRight: '10px' }}>
        <h4>Informações</h4>
        <p>{info}</p>
      </div>

      {/* Mini mapa quadrado */}
      <div id={containerId} style={{ width: '500px', height: '400px' }}></div>
    </div>
  );
};

export default MiniMap;
