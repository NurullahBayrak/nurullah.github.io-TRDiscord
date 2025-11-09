// Sidebar menüsünden bölüm gösterme
function showSection(sectionId) {
  const sections = ['servers','friends','chat','voice','settings'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById(sectionId);
  if (target) target.classList.remove('hidden');
}

// -------------------- Profil --------------------
function showMain(user, role) {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('mainSection').style.display = 'block';

  const profile = document.getElementById('userProfile');
  let badgeClass = 'member';
  let badgeText = '👤 Üye';

  if (role === 'mod') {
    badgeClass = 'mod';
    badgeText = '🛡️ Mod';
  } else if (role === 'admin') {
    badgeClass = 'admin';
    badgeText = '👑 Admin';
  }

  profile.innerHTML = `
    <span class="name">${user}</span>
    <span class="badge ${badgeClass}">${badgeText}</span>
  `;
}

// -------------------- Giriş / Kayıt --------------------
function login() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;
  if (!user || !pass) { document.getElementById('result').innerText = '⚠️ Eksik bilgi'; return; }
  document.getElementById('result').innerText = `✅ Hoş geldin ${user}`;
  showMain(user, role);
}

function register() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  const role = document.getElementById('role').value;
  if (!user || !pass) { document.getElementById('result').innerText = '⚠️ Eksik bilgi'; return; }
  document.getElementById('result').innerText = `✅ ${user} kayıt oldu`;
  showMain(user, role);
}

// -------------------- Sesli Sohbet --------------------
let stream;
async function startMic() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audio = document.getElementById('audio');
    audio.srcObject = stream;
    audio.play();
  } catch (err) {
    alert('Mikrofon açılamadı: ' + err.message);
  }
}
function stopMic() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
    document.getElementById('audio').srcObject = null;
  }
}

// -------------------- Yazılı Sohbet --------------------
function sendMsg() {
  const msg = document.getElementById('msg').value.trim();
  if (!msg) return;
  const messages = document.getElementById('messages');
  const userMsg = document.createElement('div');
  userMsg.textContent = `👤 Sen: ${msg}`;
  messages.appendChild(userMsg);

  const botMsg = document.createElement('div');
  botMsg.textContent = `🤖 Bot: "${msg}" mesajını aldım!`;
  messages.appendChild(botMsg);

  document.getElementById('msg').value = '';
  messages.scrollTop = messages.scrollHeight;
}

// -------------------- Arkadaşlar --------------------
let onlineFriends = [];
let pendingFriends = [];

function addFriend() {
  const name = document.getElementById('friendName').value.trim();
  if (!name) return;
  pendingFriends.push(name);
  document.getElementById('friendName').value = '';
  showFriends('pending');
}

function acceptFriend(name) {
  pendingFriends = pendingFriends.filter(f => f !== name);
  onlineFriends.push(name);
  showFriends('online');
}

function showFriends(type) {
  const list = document.getElementById('friendsList');
  let html = '';

  if (type === 'all') {
    html += '<li><strong>Çevrimiçi:</strong></li>';
    html += onlineFriends.map(f => `<li>${f}</li>`).join('');
    html += '<li><strong>Bekleyen:</strong></li>';
    html += pendingFriends.map(f => `<li>${f} <button onclick="acceptFriend('${f}')">Kabul Et</button></li>`).join('');
  }

  if (type === 'online') {
    html = onlineFriends.map(f => `<li>${f}</li>`).join('') || '<li>Hiç çevrimiçi yok</li>';
  }

  if (type === 'pending') {
    html = pendingFriends.map(f => `<li>${f} <button onclick="acceptFriend('${f}')">Kabul Et</button></li>`).join('') || '<li>Bekleyen istek yok</li>';
  }

  list.innerHTML = html;
}

// -------------------- Sunucular --------------------
let servers = [];

function addServer() {
  const name = document.getElementById('serverName').value.trim();
  if (!name) return;
  servers.push({ name, roles: [], members: [] });
  renderServers();
  document.getElementById('serverName').value = '';
}

function renderServers() {
  document.getElementById('serversList').innerHTML = servers.map(s => `
    <li>
      <strong>${s.name}</strong>
      <button onclick="addRole('${s.name}')">Rol Ekle</button>
      <button onclick="addNick('${s.name}')">Takma Ad Ver</button>
    </li>`).join('');
}

function addRole(serverName) {
  const role = prompt(serverName + ' için yeni rol gir:');
  if (role) {
    const server = servers.find(s => s.name === serverName);
    server.roles.push(role);
    alert('Rol eklendi: ' + role);
  }
}

function addNick(serverName) {
  const nick = prompt(serverName + ' için takma ad gir:');
  if (nick) {
    alert('Takma ad ayarlandı: ' + nick);
  }
}

// -------------------- Ayarlar --------------------
function saveSettings() {
  const notif = document.getElementById('notif').checked;
  const dark = document.getElementById('dark').checked;
  const nick = document.getElementById('nick').value.trim();
  let text = '✅ Ayarlar: ';
  text += notif ? 'Bildirimler açık, ' : 'Bildirimler kapalı, ';
  text += dark ? 'Karanlık tema, ' : 'Açık tema, ';
  text += nick ? `Takma ad: ${nick}` : 'Takma ad yok';
  document.getElementById('saveResult').innerText = text;

  // Tema değişimi
  document.body.style.backgroundColor = dark ? '#0d1117' : '#f0f0f0';
  document.body.style.color = dark ? '#c9d1d9' : '#000';
}
