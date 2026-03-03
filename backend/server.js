import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import createMqttClient from './mqtt.js';

// Configuração necessária para usar __dirname com ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Declaração única da variável 'app'
const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: false,
  maxAge: 86400,
}));
app.use(express.json());

// Servir os ficheiros estáticos do frontend (da pasta 'public')
app.use(express.static(path.join(__dirname, 'public')));

// Configurações do Banco de Dados
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;
const collectionName = process.env.COLLECTION_NAME;

// Conexão com o MongoDB
mongoose.connect(uri)
  .then(() => console.log("Backend: Conectado ao MongoDB com sucesso!"))
  .catch((err) => console.error("Backend: Erro na conexão com o MongoDB:", err));

// Schema do Mongoose - suporta múltiplos formatos de nomes de campos
const dadoSchema = new mongoose.Schema({
    // Timestamp em vários formatos
    Timestamp: { type: Date },
    timestamp: { type: Date },
    time: { type: Date },
    createdAt: { type: Date },
    
    // Velocidade
    Speed_KPH: { type: Number },
    speed_kph: { type: Number },
    speedKPH: { type: Number },
    Speed_Kph: { type: Number },
    velocidade: { type: Number },
    
    // Motor RPM
    Motor_Speed_RPM: { type: Number },
    motor_speed_rpm: { type: Number },
    motorSpeedRPM: { type: Number },
    rpm: { type: Number },
    
    // Temperaturas
    Motor_Temp_C: { type: Number },
    motor_temp_c: { type: Number },
    motorTempC: { type: Number },
    temperatura_motor: { type: Number },
    
    Ctrl_Temp_C: { type: Number },
    ctrl_temp_c: { type: Number },
    ctrlTempC: { type: Number },
    temperatura_controle: { type: Number },
    
    // Elétrico
    Volt: { type: Number },
    volt: { type: Number },
    voltage: { type: Number },
    
    Current: { type: Number },
    current: { type: Number },
    corrente: { type: Number },
    
    // Modo
    Speed_Mode: { type: String },
    speed_mode: { type: String },
    speedMode: { type: String },
    modo: { type: String },
    
    // Bateria
    Autonomia: { type: Number },
    autonomia: { type: Number },
    autonomia_km: { type: Number },
    
    Capacidade_Restante: { type: Number },
    capacidade_restante: { type: Number },
    capacidadeRestante: { type: Number },
    capacidade: { type: Number },
    
    Porcentagem_Bateria: { type: Number },
    porcentagem_bateria: { type: Number },
    porcentagemBateria: { type: Number },
    bateria: { type: Number },
    battery: { type: Number },
    
    // GPS
    Latitude: { type: Number },
    latitude: { type: Number },
    lat: { type: Number },
    
    Longitude: { type: Number },
    longitude: { type: Number },
    lon: { type: Number },
    lng: { type: Number },
    
    Heading: { type: Number },
    heading: { type: Number },
    direcao: { type: Number },
    
    // Campos extras
    Waves: { type: Number },
    waves: { type: Number },
    ondas: { type: Number },
    
    WindSpeed: { type: Number },
    wind_speed: { type: Number },
    velocidade_vento: { type: Number },
    
}, { timestamps: true, strict: false });

const Dado = mongoose.model('Dado', dadoSchema, collectionName);

// Schema para Status da Viagem
const tripStatusSchema = new mongoose.Schema({
  tripId: { type: String, required: true, unique: true },
  status: { type: String },
  startTime: { type: Date },
  endTime: { type: Date },
  startLatitude: { type: Number },
  startLongitude: { type: Number },
  endLatitude: { type: Number },
  endLongitude: { type: Number },
  totalDistance: { type: Number },
}, { timestamps: true });

const TripStatus = mongoose.model('TripStatus', tripStatusSchema, 'trip_status');

// Schema para Log da Viagem
const tripLogSchema = new mongoose.Schema({
  tripId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  logs: { type: Array, default: [] },
  summary: { type: Object, default: {} },
}, { timestamps: true });

const TripLog = mongoose.model('TripLog', tripLogSchema, 'trip_logs');

// Inicializar MQTT após conexão com MongoDB
let mqttClient = null;

mongoose.connection.once('open', () => {
  console.log('Backend: MongoDB conectado. Iniciando MQTT...');
  mqttClient = createMqttClient(Dado, TripStatus, TripLog);
});

// --- Rotas da API ---
// Debug endpoint para ver a estrutura dos dados
app.get('/debug/dados', async (req, res) => {
  try {
    const total = await Dado.countDocuments();
    const sample = await Dado.findOne({});
    res.json({ 
      totalDocuments: total,
      sampleDocument: sample,
      collectionName: collectionName
    });
  } catch (err) {
    console.error('Debug error:', err);
    res.status(500).json({ error: 'Erro ao debugar dados', details: err.message });
  }
});

// Rota para o DASHBOARD (dados recentes)
app.get('/dados', async (req, res) => {
  try {
    console.log('Fetching dados from collection:', collectionName);
    const dados = await Dado.find({}).sort({ Timestamp: -1, timestamp: -1, createdAt: -1 }).limit(100);
    console.log('Found', dados.length, 'documents');
    res.json(dados.reverse());
  } catch (err) {
    console.error('Error fetching dados:', err);
    res.status(500).json({ error: 'Erro ao buscar dados recentes', details: err.message });
  }
});

// Rota para o HISTÓRICO (dados completos)
app.get('/dados/completo', async (req, res) => {
  try {
    const todosOsDados = await Dado.find({}).sort({ Timestamp: 1 });
    res.json(todosOsDados);
  } catch (_err) {
    res.status(500).json({ error: 'Erro ao buscar histórico completo' });
  }
});

// Rota paginada para o HISTÓRICO
app.get('/dados/historico', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query = {};
    if (startDate || endDate) {
      query.Timestamp = {};
      if (startDate) query.Timestamp.$gte = new Date(startDate);
      if (endDate) query.Timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const dados = await Dado.find(query)
      .sort({ Timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Dado.countDocuments(query);

    res.json({
      data: dados.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (_err) {
    res.status(500).json({ error: 'Erro ao buscar histórico paginado' });
  }
});

// Rota para contar total de registros
app.get('/dados/historico/count', async (req, res) => {
  try {
    const total = await Dado.countDocuments();
    res.json({ total });
  } catch (_err) {
    res.status(500).json({ error: 'Erro ao contar registros' });
  }
});

// Rotas para Trip Status
app.get('/trip/status', async (req, res) => {
  try {
    const status = await TripStatus.findOne({}).sort({ createdAt: -1 });
    res.json(status);
  } catch (_err) {
    res.status(500).json({ error: 'Erro ao buscar status da viagem' });
  }
});

app.get('/trip/status/all', async (req, res) => {
  try {
    const statuses = await TripStatus.find({}).sort({ createdAt: -1 });
    res.json(statuses);
  } catch (_err) {
    res.status(500).json({ error: 'Erro ao buscar histórico de viagens' });
  }
});

// Rotas para Trip Logs
app.get('/trip/logs', async (req, res) => {
  try {
    const logs = await TripLog.find({}).sort({ timestamp: -1 });
    res.json(logs);
  } catch (_err) {
    res.status(500).json({ error: 'Erro ao buscar logs das viagens' });
  }
});

app.get('/trip/logs/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;
    const log = await TripLog.findOne({ tripId });
    res.json(log);
  } catch (_err) {
    res.status(500).json({ error: 'Erro ao buscar log da viagem' });
  }
});

// Rota para obter dados sobre Velocidade do Vento da API OpenMeteo
const api_weather_url = "https://api.open-meteo.com/v1/forecast";
app.get('/weather', async (req, res) => {
    // --- CORREÇÃO: Usar req.query para ler parâmetros opcionais da URL ---
    const latitude = req.query.lat || -1.4558; // Coordenadas de Belém como padrão
    const longitude = req.query.lon || -48.5039;

    try {
        const params = {
            latitude,
            longitude,
            hourly: "windspeed_10m",
            timezone: 'auto'
        };
        const response = await axios.get(api_weather_url, { params });
        res.json(response.data);
    } catch (error) {
        console.error("[OpenMeteo] Erro:", error.message);
        res.status(500).json({ error: "Falha ao obter dados de meteorologia" });
    }
});


// --- Rota "Catch-All" para o Frontend ---
// Esta rota deve vir DEPOIS de todas as suas rotas de API.
// Express 5 usa sintaxe diferente para wildcard
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
