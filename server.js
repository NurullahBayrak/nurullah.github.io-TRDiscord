const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { exec } = require('child_process'); // Windows'ta tarayıcı açmak için

const app = express();
app.use(cors({ origin: ["http://localhost:3000"], credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // index.html, style.css, script.js burada olacak

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Bellek içi veritabanı
let users = {};
let friendRequests = {};
let servers = {};
let messages = {};

// ---------------- Kayıt ----------------
app.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Eksik alan" });
  }
  if (users[username]) {
    return res.status(400).json({ error: "Kullanıcı var" });
  }
  users[username] = { password, friends: [] };
  res.cookie("trdiscord_user", username, { httpOnly: true, sameSite: "lax" });
  return res.json({ success: true, user: username });
});

// ---------------- Giriş ----------------
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Eksik alan" });
  }
  if (!users[username] || users[username].password !== password) {
    return res.status(400).json({ error: "Hatalı giriş" });
  }
  res.cookie("trdiscord_user", username, { httpOnly: true, sameSite: "lax" });
  return res.json({ success: true, user: username });
});

// ---------------- Çıkış ----------------
app.post('/logout', (req, res) => {
  res.clearCookie("trdiscord_user");
  res.json({ success: true });
});

// ---------------- Arkadaş isteği ----------------
app.post('/friend-request', (req, res) => {
  const { from, to } = req.body;
  if (!users[to]) users[to] = { password: '', friends: [] };
  const id = 'req_' + Math.random().toString(36).slice(2, 10);
  friendRequests[id] = { id, from, to, status: 'pending' };
  res.json({ success: true });
});

// ---------------- Arkadaş listesi ----------------
app.get('/friends/:user', (req, res) => {
  const user = req.params.user;
  const requests = Object.values(friendRequests).filter(r => r.to === user && r.status === 'pending');
  const sent = Object.values(friendRequests).filter(r => r.from === user && r.status === 'pending');
  const friends = users[user]?.friends || [];
  res.json({ requests, sent, friends });
});

// ---------------- Sunucu oluşturma ----------------
app.post('/servers', (req, res) => {
  const { name, owner } = req.body;
  const id = 'srv_' + Math.random().toString(36).slice(2, 10);
  servers[id] = { id, name, owner, members: [owner], channels: ['genel'] };
  messages[id] = { genel: [] };
  res.json({ success: true, server: servers[id] });
});

// ---------------- Sunucu listesi ----------------
app.get('/servers', (req, res) => {
  res.json(Object.values(servers));
});

// ---------------- Sunucu detayı ----------------
app.get('/servers/:id', (req, res) => {
  const { id } = req.params;
  if (!servers[id]) return res.status(404).json({ error: "Sunucu yok" });
  res.json(servers[id]);
});

// ---------------- Kanal ekleme ----------------
app.post('/servers/:id/channels', (req, res) => {
  const { id } = req.params;
  const { channel } = req.body;
  if (!servers[id]) return res.status(404).json({ error: "Sunucu yok" });
  if (servers[id].channels.includes(channel)) {
    return res.status(400).json({ error: "Kanal zaten var" });
  }
  servers[id].channels.push(channel);
  if (!messages[id]) messages[id] = {};
  messages[id][channel] = [];
  res.json({ success: true, channels: servers[id].channels });
});

// ---------------- Kanal silme ----------------
app.delete('/servers/:id/channels/:channel', (req, res) => {
  const { id, channel } = req.params;
  if (!servers[id]) return res.status(404).json({ error: "Sunucu yok" });
  servers[id].channels = servers[id].channels.filter(c => c !== channel);
  if (messages[id]) delete messages[id][channel];
  res.json({ success: true, channels: servers[id].channels });
});

// ---------------- Socket.io ----------------
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı');

  socket.on('joinServer', ({ serverId, username }) => {
    socket.join(serverId);
    console.log(`${username} sunucuya katıldı: ${serverId}`);
  });

  socket.on('sendMessage', ({ serverId, channel, user, text }) => {
    const msg = { user, text, time: Date.now() };
    if (!messages[serverId]) messages[serverId] = {};
    if (!messages[serverId][channel]) messages[serverId][channel] = [];
    messages[serverId][channel].push(msg);
    io.to(serverId).emit('newMessage', { channel, msg });
  });

  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı');
  });
});

server.listen(3000, () => {
  console.log('Backend çalışıyor: http://localhost:3000');
  exec('start http://localhost:3000'); // Windows'ta varsayılan tarayıcıyı açar
});
