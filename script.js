const socket = io("http://localhost:3000");
let session = { currentUser: null };
let ui = { currentServer: null, currentTextChannel: null };

// ---------------- Güvenli JSON Parse ----------------
async function parseJsonSafe(r) {
  try {
    return await r.json();
  } catch {
    return {}; // boş obje dön, hata fırlatma
  }
}

// --------------- Auth ---------------

// Kullanıcı kayıt
async function register() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  const res = document.getElementById("authResult");

  try {
    const r = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await parseJsonSafe(r);
    if (!r.ok || !data.success) {
      res.textContent = "⚠️ " + (data.error || "Kayıt başarısız");
      return;
    }

    session.currentUser = data.user;
    res.textContent = "✅ Kayıt başarılı!";
    openApp(data.user);
  } catch (e) {
    res.textContent = "⚠️ " + e.message;
  }
}

// Kullanıcı giriş
async function login() {
  const u = document.getElementById("username").value.trim();
  const p = document.getElementById("password").value.trim();
  const res = document.getElementById("authResult");

  try {
    const r = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: u, password: p })
    });

    const data = await parseJsonSafe(r);
    if (!r.ok || !data.success) {
      res.textContent = "⚠️ " + (data.error || "Hatalı giriş");
      return;
    }

    session.currentUser = data.user;
    res.textContent = "✅ Giriş başarılı!";
    openApp(data.user);
  } catch (e) {
    res.textContent = "⚠️ " + e.message;
  }
}

// Kullanıcı çıkış
async function logout() {
  try {
    const r = await fetch("/logout", { method: "POST", credentials: "include" });
    const data = await parseJsonSafe(r);

    if (data.success) {
      session.currentUser = null;
      document.getElementById("authSection").classList.remove("hidden");
      document.getElementById("app").classList.add("hidden");
      document.getElementById("authResult").innerText = "Çıkış yapıldı!";
    }
  } catch (e) {
    document.getElementById("authResult").innerText = "⚠️ " + e.message;
  }
}

// ---------------- Arkadaşlar ----------------
async function loadFriends(user) {
  try {
    const r = await fetch(`/friends/${user}`, { credentials: "include" });
    const data = await r.json();
    const list = document.getElementById("friendsList");
    const requests = document.getElementById("friendRequests");

    list.innerHTML = "";
    requests.innerHTML = "";

    // Arkadaş listesi
    data.friends.forEach(f => {
      const li = document.createElement("li");
      li.textContent = f;
      list.appendChild(li);
    });

    // Bekleyen istekler
    data.requests.forEach(req => {
      const li = document.createElement("li");
      li.textContent = `İstek: ${req.from}`;
      requests.appendChild(li);
    });
  } catch (e) {
    console.error("Arkadaşlar yüklenemedi:", e);
  }
}

// ---------------- Arkadaş ekleme ----------------
async function addFriend() {
  const friendName = document.getElementById("newFriend").value.trim();
  if (!friendName) return;

  try {
    const r = await fetch("/friends/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ from: session.currentUser, to: friendName })
    });

    const data = await parseJsonSafe(r);
    if (data.success) {
      alert("✅ Arkadaş isteği gönderildi!");
      loadFriends(session.currentUser); // listeyi yenile
    } else {
      alert("⚠️ " + (data.error || "Arkadaş eklenemedi"));
    }
  } catch (e) {
    console.error("Arkadaş ekleme hatası:", e);
  }
}

// ---------------- Sunucular ----------------
async function loadServers() {
  try {
    const r = await fetch("/servers", { credentials: "include" });
    const data = await r.json();
    const list = document.getElementById("serversList");
    list.innerHTML = "";

    data.forEach(srv => {
      const li = document.createElement("li");
      li.textContent = srv.name + " (Owner: " + srv.owner + ")";
      li.onclick = () => openServer(srv); // Sunucuya tıklayınca aç
      list.appendChild(li);
    });
  } catch (e) {
    console.error("Sunucular yüklenemedi:", e);
  }
}

// ---------------- Sunucu oluşturma ----------------
async function createServer() {
  const serverName = document.getElementById("newServer").value.trim();
  if (!serverName) return;

  try {
    const r = await fetch("/servers/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: serverName, owner: session.currentUser })
    });

    const data = await parseJsonSafe(r);
    if (data.success) {
      alert("✅ Sunucu oluşturuldu!");
      loadServers(); // listeyi yenile
    } else {
      alert("⚠️ " + (data.error || "Sunucu oluşturulamadı"));
    }
  } catch (e) {
    console.error("Sunucu oluşturma hatası:", e);
  }
}

// ---------------- Kanallar ----------------
async function loadChannels(server) {
  try {
    const r = await fetch(`/servers/${server.name}/channels`, { credentials: "include" });
    const data = await r.json();
    const list = document.getElementById("channelsList");
    list.innerHTML = "";

    data.forEach(ch => {
      const li = document.createElement("li");
      li.textContent = ch.name;
      li.onclick = () => openChannel(ch);
      list.appendChild(li);
    });
  } catch (e) {
    console.error("Kanallar yüklenemedi:", e);
  }
}

async function createChannel() {
  const channelName = document.getElementById("newChannel").value.trim();
  if (!channelName || !ui.currentServer) return;

  try {
    const r = await fetch(`/servers/${ui.currentServer.name}/channels/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: channelName })
    });

    const data = await parseJsonSafe(r);
    if (data.success) {
      alert("✅ Kanal oluşturuldu!");
      loadChannels(ui.currentServer);
    } else {
      alert("⚠️ " + (data.error || "Kanal oluşturulamadı"));
    }
  } catch (e) {
    console.error("Kanal oluşturma hatası:", e);
  }
}

function openChannel(channel) {
  ui.currentTextChannel = channel;
  console.log("Kanal açıldı:", channel.name);
  document.getElementById("messages").innerHTML = ""; // sohbet temizle
}

// ---------------- Uygulama Açılışı ----------------
function openApp(user) {
  document.getElementById("authSection").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("profileNick").textContent = user;
  document.getElementById("profileStatus").textContent = "Çevrimiçi";

  // Arkadaşlar ve sunucular yükle
  loadFriends(user);
  loadServers();
}

// ---------------- Sunucu Açma ----------------
function openServer(server) {
  ui.currentServer = server;
  console.log("Sunucu açıldı:", server.name);
  loadChannels(server); // sunucu açıldığında kanalları yükle
}

// ---------------- Sohbet ----------------

// Mesaj gönder
function sendMessage() {
  const input = document.getElementById("messageInput");
  const msg = input.value.trim();
  if (!msg || !session.currentUser) return;

  // Sunucuya mesaj gönder
  socket.emit("message", {
    user: session.currentUser,
    text: msg,
    server: ui.currentServer ? ui.currentServer.name : null,
    channel: ui.currentTextChannel ? ui.currentTextChannel.name : null
  });
}
