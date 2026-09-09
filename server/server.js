const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"]
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- REST API ENDPOINTS ---

// GET Overview Stats
app.get('/api/stats', (req, res) => {
  const alerts = db.getSOSAlerts();
  const camps = db.getCamps();
  const victims = db.getVictims();

  const activeAlerts = alerts.filter(a => a.status !== 'Resolved').length;
  const criticalCount = alerts.filter(a => a.urgency === 'Critical' && a.status !== 'Resolved').length;
  const totalSheltered = camps.reduce((acc, c) => acc + (c.current_occupancy || 0), 0);
  const lowStockCamps = camps.filter(c => c.status === 'Warning').length;

  res.json({
    active_alerts: activeAlerts,
    critical_alerts: criticalCount,
    total_sheltered: totalSheltered,
    total_camps: camps.length,
    low_stock_camps: lowStockCamps,
    total_registered_victims: victims.length
  });
});

// GET & POST SOS Alerts
app.get('/api/sos', (req, res) => {
  res.json(db.getSOSAlerts());
});

app.post('/api/sos', (req, res) => {
  try {
    const newAlert = db.addSOSAlert(req.body);
    io.emit('victim_sos_received', newAlert);
    console.log(`[SOS EMITTED] ${newAlert.id} - ${newAlert.category} (${newAlert.urgency})`);
    res.status(201).json(newAlert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sos/:id', (req, res) => {
  const { id } = req.params;
  const { status, dispatch_team } = req.body;
  const updated = db.updateSOSStatus(id, status, dispatch_team);
  if (updated) {
    io.emit('sos_status_updated', updated);
    res.json(updated);
  } else {
    res.status(404).json({ error: "SOS alert not found" });
  }
});

// GET & PUT Relief Camps
app.get('/api/camps', (req, res) => {
  res.json(db.getCamps());
});

app.put('/api/camps/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.updateCampStock(id, req.body);
  if (updated) {
    io.emit('camp_updated', updated);
    res.json(updated);
  } else {
    res.status(404).json({ error: "Camp not found" });
  }
});

// GET & POST Registered Victims
app.get('/api/victims', (req, res) => {
  res.json(db.getVictims());
});

app.post('/api/victims', (req, res) => {
  try {
    const victim = db.registerVictim(req.body);
    io.emit('victim_registered', victim);
    io.emit('camp_updated', db.getCamps().find(c => c.id === victim.camp_id));
    res.status(201).json(victim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST Face Matching Endpoint
app.post('/api/victims/match-face', (req, res) => {
  try {
    const { face_descriptor } = req.body;
    const matches = db.matchFace(face_descriptor);
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SERVE PRODUCTION REACT FRONTEND ON RENDER ---
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Render Production Mode] Serving compiled frontend from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// --- SOCKET.IO REALTIME HANDLERS ---
io.on('connection', (socket) => {
  console.log(`[Socket Connected] Client ID: ${socket.id}`);

  socket.on('victim_sos', (payload) => {
    console.log('[Socket Event] victim_sos received:', payload.category || 'SOS');
    const newAlert = db.addSOSAlert(payload);
    io.emit('victim_sos_received', newAlert);
  });

  socket.on('audio_sos_alert', (payload) => {
    console.log('[Socket Event] AUDIO AI SOS ALERT DETECTED!');
    const newAlert = db.addSOSAlert({
      ...payload,
      trigger_type: 'Voice_SOS_LockedPhone',
      urgency: 'Critical',
      category: payload.category || 'Voice SOS Locked Phone'
    });
    io.emit('victim_sos_received', newAlert);
  });

  socket.on('update_sos_status', ({ id, status, dispatch_team }) => {
    const updated = db.updateSOSStatus(id, status, dispatch_team);
    if (updated) {
      io.emit('sos_status_updated', updated);
    }
  });

  socket.on('camp_stock_update', ({ camp_id, stockUpdates }) => {
    const updated = db.updateCampStock(camp_id, stockUpdates);
    if (updated) {
      io.emit('camp_updated', updated);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket Disconnected] Client ID: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(` DISASTER MANAGEMENT SERVER RUNNING ON PORT ${PORT}`);
  console.log(` Render Web Service Active: http://0.0.0.0:${PORT}`);
  console.log(` WebSocket Realtime Engine Active (Socket.io)`);
  console.log(`=======================================================`);
});
