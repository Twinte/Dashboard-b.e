import mqtt from 'mqtt';
import mongoose from 'mongoose';

const generateClientId = () => `barco-${Math.random().toString(16).slice(2, 10)}`;

const extractNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'object') {
    if (value.percentage !== undefined) return value.percentage;
    if (value.value !== undefined) return value.value;
    if (value.voltage !== undefined) return value.voltage;
    const keys = Object.keys(value);
    if (keys.length > 0) {
      const firstVal = value[keys[0]];
      if (typeof firstVal === 'number') return firstVal;
    }
  }
  return null;
};

const extractString = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length > 0) {
      const firstVal = value[keys[0]];
      if (typeof firstVal === 'string') return firstVal;
    }
  }
  return null;
};

const mapTelemetryData = (data) => {
  console.log('[MQTT] Raw data received:', JSON.stringify(data).slice(0, 200));
  
  return {
    Timestamp: data.timestamp || data.time || new Date(),
    Speed_KPH: extractNumber(data.speed || data.speed_kph || data.speedKPH || data.velocidade),
    Motor_Speed_RPM: extractNumber(data.motor_rpm || data.motorSpeedRPM || data.motor_speed_rpm || data.rpm),
    Motor_Temp_C: extractNumber(data.motor_temp || data.motorTempC || data.motor_temp_c || data.temperatura_motor),
    Ctrl_Temp_C: extractNumber(data.ctrl_temp || data.ctrlTempC || data.ctrl_temp_c || data.temperatura_controle),
    Volt: extractNumber(data.voltage || data.volt || data.v),
    Current: extractNumber(data.current || data.corrente || data.ampere),
    Speed_Mode: extractString(data.mode || data.speed_mode || data.speedMode || data.modo),
    Autonomia: extractNumber(data.autonomy || data.autonomia || data.autonomia_km),
    Capacidade_Restante: extractNumber(data.capacity || data.capacidade || data.capacidade_restante || data.battery_percent),
    Latitude: extractNumber(data.latitude || data.lat || data.gps_lat),
    Longitude: extractNumber(data.longitude || data.lon || data.lng || data.gps_lng),
    Heading: extractNumber(data.heading || data.direcao || data.compass),
    Porcentagem_Bateria: extractNumber(data.battery || data.bateria || data.battery_percent || data.porcentagem_bateria || data['Porcentagem bateria']),
  };
};

const mapTripStatus = (data) => {
  return {
    tripId: data.trip_id || data.tripId || null,
    status: data.status || null,
    startTime: data.start_time || data.startTime || null,
    endTime: data.end_time || data.endTime || null,
    startLatitude: data.start_lat || data.startLatitude || null,
    startLongitude: data.start_lon || data.startLongitude || null,
    endLatitude: data.end_lat || data.endLatitude || null,
    endLongitude: data.end_lon || data.endLongitude || null,
    totalDistance: data.distance || data.total_distance || data.totalDistance || null,
  };
};

const mapTripLog = (data) => {
  return {
    tripId: data.trip_id || data.tripId || null,
    timestamp: data.timestamp || new Date(),
    logs: data.logs || data.entries || [],
    summary: data.summary || {},
  };
};

const createMqttClient = (Dado, TripStatus, TripLog) => {
  const MQTT_BROKER = process.env.MQTT_BROKER || 'broker.hivemq.com';
  const MQTT_PORT = process.env.MQTT_PORT || 8884;
  const MQTT_TOPIC_LIVE = process.env.MQTT_TOPIC_LIVE || 'boats/barco-01/telemetry/live';
  const MQTT_TOPIC_STATUS = process.env.MQTT_TOPIC_STATUS || 'boats/barco-01/trip/status';
  const MQTT_TOPIC_LOG = process.env.MQTT_TOPIC_LOG || 'boats/barco-01/trip/log';
  const MQTT_SSL = process.env.MQTT_SSL !== 'false';

  const protocol = MQTT_SSL ? 'mqtts' : 'mqtt';
  const brokerUrl = `${protocol}://${MQTT_BROKER}:${MQTT_PORT}`;
  
  const clientId = generateClientId();
  
  console.log(`[MQTT] Connecting to ${brokerUrl} with client ID: ${clientId}`);

  const client = mqtt.connect(brokerUrl, {
    clientId: clientId,
    clean: true,
    connectTimeout: 30000,
    reconnectPeriod: 5000,
    qos: 1,
    rejectUnauthorized: false,
  });

  client.on('connect', () => {
    console.log('[MQTT] Connected successfully!');
    
    client.subscribe([
      MQTT_TOPIC_LIVE,
      MQTT_TOPIC_STATUS,
      MQTT_TOPIC_LOG
    ], { qos: 1 }, (err) => {
      if (err) {
        console.error('[MQTT] Subscription error:', err);
      } else {
        console.log('[MQTT] Subscribed to topics:');
        console.log(`  - ${MQTT_TOPIC_LIVE}`);
        console.log(`  - ${MQTT_TOPIC_STATUS}`);
        console.log(`  - ${MQTT_TOPIC_LOG}`);
      }
    });
  });

  client.on('reconnect', () => {
    console.log('[MQTT] Reconnecting...');
  });

  client.on('error', (err) => {
    console.error('[MQTT] Error:', err.message);
  });

  client.on('offline', () => {
    console.log('[MQTT] Connection offline');
  });

  client.on('message', async (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log('[MQTT] Received on', topic);
      
      if (topic === MQTT_TOPIC_LIVE) {
        const telemetryData = mapTelemetryData(payload);
        console.log('[MQTT] Mapped data:', JSON.stringify(telemetryData).slice(0, 200));
        
        const novoDado = new Dado(telemetryData);
        await novoDado.save();
        console.log(`[MQTT] ✅ Saved telemetry: Speed ${telemetryData.Speed_KPH} KPH`);
      
      } else if (topic === MQTT_TOPIC_STATUS) {
        const statusData = mapTripStatus(payload);
        
        await TripStatus.findOneAndUpdate(
          { tripId: statusData.tripId },
          statusData,
          { upsert: true, new: true }
        );
        console.log(`[MQTT] ✅ Updated trip status: ${statusData.status}`);
      
      } else if (topic === MQTT_TOPIC_LOG) {
        const logData = mapTripLog(payload);
        
        const novoLog = new TripLog(logData);
        await novoLog.save();
        console.log(`[MQTT] ✅ Saved trip log: ${logData.tripId}`);
      }
    } catch (err) {
      console.error('[MQTT] ❌ Error processing message:', err.message);
    }
  });

  return client;
};

export default createMqttClient;
