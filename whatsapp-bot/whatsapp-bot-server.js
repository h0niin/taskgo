/**
 * TaskGo Kozhikode — Real WhatsApp Phone Bot & Expo Go LAN Bridge Server
 *
 * Features:
 * 1. Real WhatsApp Phone Connection via QR Code (@whiskeysockets/baileys multi-device).
 *    - Scan the QR code printed in the terminal (or at http://localhost:3001) using
 *      WhatsApp -> Linked Devices -> Link a Device.
 *    - Works when messaged from another phone OR in your own "Message Yourself" chat.
 * 2. Live LAN Sync Bridge for the Expo Go Mobile App (port 3001):
 *    - GET  /api/orders          (Polled by Expo Go app to receive WhatsApp orders & updates)
 *    - POST /api/sync-from-app   (Called by Expo Go store when Runner bids, counters, updates progress, submits proof, or confirms cash)
 *    - POST /api/runner-action   (Direct helper endpoint for runner actions)
 *    - POST /api/whatsapp/send   (Send/simulate a customer WhatsApp message via HTTP)
 *    - POST /webhook/whatsapp    (Meta Cloud API / Twilio WhatsApp Webhook compatibility)
 */

'use strict';

const http = require('http');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { TaskGoOmnichannelEngine } = require('./bilingual-fsm');

const PORT = Number(process.env.PORT || 3001);
const AUTH_DIR = path.join(__dirname, 'wa_auth_info');

// ─── Track WhatsApp Connection State ─────────────────────────────────────────

let waSocket = null;
let waConnectionStatus = 'INITIALIZING'; // INITIALIZING | QR_READY | CONNECTED | DISCONNECTED | FALLBACK_ONLY
let latestQrString = null;
let connectedPhoneJid = null;

// Track message IDs sent by the bot so self-chat ("Message Yourself") never loops
const sentBotMessageIds = new Set();

// ─── Helper: Normalize Phone Number to WhatsApp JID ──────────────────────────

function toWhatsAppJid(phoneOrJid) {
  const raw = String(phoneOrJid || '').trim();
  if (raw.includes('@s.whatsapp.net') || raw.includes('@lid') || raw.includes('@g.us')) {
    return raw;
  }
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '919876543210@s.whatsapp.net';
  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `${normalized}@s.whatsapp.net`;
}

function jidToCleanPhone(jid) {
  return String(jid || '')
    .replace(/@.*$/, '')
    .replace(/:\d+$/, '');
}

// ─── Instantiate the Bilingual Omnichannel Engine ────────────────────────────

const engine = new TaskGoOmnichannelEngine({
  onSendWhatsApp: async (phone, text, meta = {}) => {
    const jid = toWhatsAppJid(phone);
    console.log(`\n📤 [WhatsApp Bot ➔ ${jidToCleanPhone(jid)}]:\n${text}\n`);

    if (waSocket && waConnectionStatus === 'CONNECTED') {
      try {
        const sent = await waSocket.sendMessage(jid, { text });
        if (sent?.key?.id) {
          sentBotMessageIds.add(sent.key.id);
        }

        // If proof includes valid image URLs, also send them as media captions if reachable
        if (meta.completionPhotoUri && /^https?:\/\//i.test(meta.completionPhotoUri)) {
          const sentImg = await waSocket.sendMessage(jid, {
            image: { url: meta.completionPhotoUri },
            caption: '📷 TaskGo Delivery Completion Photo',
          });
          if (sentImg?.key?.id) sentBotMessageIds.add(sentImg.key.id);
        }
        if (meta.billPhotoUri && /^https?:\/\//i.test(meta.billPhotoUri)) {
          const sentBill = await waSocket.sendMessage(jid, {
            image: { url: meta.billPhotoUri },
            caption: '🧾 TaskGo Verified Store Receipt',
          });
          if (sentBill?.key?.id) sentBotMessageIds.add(sentBill.key.id);
        }
      } catch (err) {
        console.error(`⚠️ Failed to send real WhatsApp message to ${jid}:`, err.message);
      }
    }
  },
  onStateChange: (event) => {
    if (event.type === 'ORDER_CREATED') {
      console.log(
        `🆕 [Omnichannel Engine] Order #${event.order.id.toUpperCase()} created via WhatsApp (${event.order.category}) — Ready in Expo Go Runner Feed!`,
      );
    } else if (event.type === 'APP_SYNC') {
      console.log(
        `🔄 [Expo Go ➔ Bridge] Synced action "${event.action}" for Order #${event.order.id.toUpperCase()} (Status: ${event.order.status})`,
      );
    }
  },
});

// ─── Start Real WhatsApp Multi-Device Connection (@whiskeysockets/baileys) ───

async function startRealWhatsAppConnection() {
  let baileys;
  let qrcodeTerminal;
  let pino;

  try {
    baileys = require('@whiskeysockets/baileys');
  } catch {
    waConnectionStatus = 'FALLBACK_ONLY';
    console.log(
      '\nℹ️  @whiskeysockets/baileys is not installed yet.\n' +
        '   Run `npm install` in this folder to connect your real WhatsApp phone via QR code.\n' +
        '   The Expo Go LAN Bridge and Web WhatsApp Console are active now!\n',
    );
    return;
  }

  try {
    qrcodeTerminal = require('qrcode-terminal');
  } catch {
    qrcodeTerminal = null;
  }

  try {
    pino = require('pino');
  } catch {
    pino = null;
  }

  const makeWASocket = baileys.default || baileys.makeWASocket;
  const {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = baileys;

  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version = [2, 3000, 1015901307];
  try {
    const latest = await fetchLatestBaileysVersion();
    if (latest?.version) version = latest.version;
  } catch {
    // Use default version if offline
  }

  const logger = pino ? pino({ level: 'silent' }) : undefined;

  waSocket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: !qrcodeTerminal,
    logger,
    browser: ['TaskGo Kozhikode Bot', 'Chrome', '1.0.0'],
    syncFullHistory: false,
  });

  waSocket.ev.on('creds.update', saveCreds);

  waSocket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQrString = qr;
      waConnectionStatus = 'QR_READY';
      console.log('\n============================================================');
      console.log('📱 SCAN THIS QR CODE WITH YOUR WHATSAPP PHONE:');
      console.log('   WhatsApp ➔ Settings / Menu ➔ Linked Devices ➔ Link a Device');
      console.log('============================================================\n');
      if (qrcodeTerminal) {
        qrcodeTerminal.generate(qr, { small: true });
      } else {
        console.log('QR Data:', qr);
      }
    }

    if (connection === 'open') {
      waConnectionStatus = 'CONNECTED';
      latestQrString = null;
      connectedPhoneJid = waSocket.user?.id || 'Connected';
      console.log('\n✅ REAL WHATSAPP PHONE CONNECTED!');
      console.log(`   Linked Account: ${jidToCleanPhone(connectedPhoneJid)}`);
      console.log('   Send "Hi" or "Namaskaram" to this WhatsApp number to start an errand!\n');
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      waConnectionStatus = 'DISCONNECTED';
      console.log(
        `⚠️ WhatsApp connection closed (code: ${statusCode}). Reconnecting: ${shouldReconnect}`,
      );

      if (shouldReconnect) {
        setTimeout(() => {
          void startRealWhatsAppConnection();
        }, 3000);
      } else {
        console.log(
          'ℹ️ Logged out from WhatsApp. Delete ./wa_auth_info and restart to scan a new QR code.',
        );
      }
    }
  });

  waSocket.ev.on('messages.upsert', async (event) => {
    if (event.type !== 'notify') return;

    for (const msg of event.messages || []) {
      if (!msg.message || !msg.key?.remoteJid) continue;

      // Ignore group chats and status broadcasts
      if (
        msg.key.remoteJid.endsWith('@g.us') ||
        msg.key.remoteJid === 'status@broadcast'
      ) {
        continue;
      }

      // Prevent replying to the bot's own outbound messages
      if (sentBotMessageIds.has(msg.key.id)) {
        continue;
      }

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.buttonsResponseMessage?.selectedDisplayText ||
        msg.message.listResponseMessage?.title ||
        '';

      if (!text.trim()) continue;

      // If the user is testing from the same phone ("Message Yourself"), ignore messages
      // that look like bot outputs just in case
      if (
        msg.key.fromMe &&
        /^(👋|🌐|✅|🛵|📋|🎉|💳|📍|🛍️|📦|🏁|🧾|💵|⭐|⚠️|🛑|❌|📊|🛠️|🛒|📝|💰|🔄|💬|⏳|ℹ️)/.test(
          text.trim(),
        )
      ) {
        continue;
      }

      const senderPhone = msg.key.remoteJid;
      const pushName = msg.pushName || 'Customer';

      console.log(
        `\n📩 [WhatsApp Customer (${pushName} / ${jidToCleanPhone(senderPhone)})]: ${text}`,
      );

      try {
        await engine.handleIncomingMessage(senderPhone, text, pushName);
      } catch (err) {
        console.error('Error processing incoming WhatsApp message:', err);
      }
    }
  });
}

// ─── Discover Laptop LAN IPv4 Addresses (for Expo Go on Physical Phone) ──────

function getLanIpAddresses() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips.length > 0 ? ips : ['localhost'];
}

// ─── HTTP Server & Web Console UI ────────────────────────────────────────────

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function renderStatusPageHtml(lanIps) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TaskGo Kozhikode — WhatsApp Bridge & Live Console</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { margin: 0; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; min-height: 100vh; }
    header { background: #1e293b; padding: 14px 24px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .brand { font-size: 18px; font-weight: 700; color: #22c55e; display: flex; align-items: center; gap: 8px; }
    .badge { padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #334155; }
    .badge.ok { background: #14532d; color: #86efac; }
    .main { display: grid; grid-template-columns: 420px 1fr; gap: 20px; padding: 20px; flex: 1; max-width: 1400px; width: 100%; margin: 0 auto; }
    @media (max-width: 960px) { .main { grid-template-columns: 1fr; } }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
    .card-header { padding: 12px 16px; background: #075e54; color: #fff; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
    .card-header.secondary { background: #1e293b; border-bottom: 1px solid #334155; }
    .chat-box { flex: 1; height: 520px; overflow-y: auto; padding: 14px; background: #0b141a; display: flex; flex-direction: column; gap: 8px; }
    .bubble { max-width: 85%; padding: 9px 12px; border-radius: 10px; font-size: 13.5px; line-height: 1.45; white-space: pre-wrap; word-break: break-word; }
    .bubble.in { align-self: flex-end; background: #005c4b; color: #e9edef; border-bottom-right-radius: 2px; }
    .bubble.out { align-self: flex-start; background: #202c33; color: #e9edef; border-bottom-left-radius: 2px; }
    .chat-input { display: flex; gap: 8px; padding: 10px; background: #202c33; }
    .chat-input input { flex: 1; padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #2a3942; color: #fff; font-size: 14px; }
    .chat-input button { padding: 10px 16px; border-radius: 8px; border: none; background: #00a884; color: #fff; font-weight: 600; cursor: pointer; }
    .orders-list { padding: 16px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 580px; }
    .order-item { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px; font-size: 13px; }
    .order-head { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 6px; color: #38bdf8; }
    .meta { color: #94a3b8; font-size: 12px; margin-top: 4px; }
  </style>
</head>
<body>
  <header>
    <div class="brand">🛵 TaskGo Kozhikode — Real WhatsApp + Expo Go Bridge</div>
    <div>
      <span id="waStatus" class="badge">Checking WhatsApp...</span>
      <span class="badge ok">Expo Go LAN URL: http://${lanIps[0]}:${PORT}</span>
    </div>
  </header>
  <div class="main">
    <div class="card">
      <div class="card-header">
        <span>📱 Live WhatsApp Chat Stream</span>
        <span style="font-size:12px;opacity:0.85;">EN / മലയാളം</span>
      </div>
      <div id="chatBox" class="chat-box"></div>
      <form id="chatForm" class="chat-input">
        <input id="msgInput" type="text" placeholder="Type WhatsApp message (e.g. Hi, 1, 2, YES, PAY)..." autocomplete="off" />
        <button type="submit">Send</button>
      </form>
    </div>
    <div class="card">
      <div class="card-header secondary">
        <span>📦 Shared Errand Orders (Synced with Expo Go App)</span>
      </div>
      <div id="ordersBox" class="orders-list"></div>
    </div>
  </div>
  <script>
    const chatBox = document.getElementById('chatBox');
    const ordersBox = document.getElementById('ordersBox');
    const waStatus = document.getElementById('waStatus');
    let lastMsgCount = 0;

    async function refresh() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        waStatus.textContent = 'WhatsApp: ' + data.waConnectionStatus + (data.connectedPhone ? ' (' + data.connectedPhone + ')' : '');
        waStatus.className = 'badge ' + (data.waConnectionStatus === 'CONNECTED' ? 'ok' : '');

        if (data.messages.length !== lastMsgCount) {
          lastMsgCount = data.messages.length;
          chatBox.innerHTML = data.messages.map(m =>
            '<div class="bubble ' + (m.direction === 'INBOUND' ? 'in' : 'out') + '">' +
            m.text.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            '</div>'
          ).join('');
          chatBox.scrollTop = chatBox.scrollHeight;
        }

        if (data.orders.length === 0) {
          ordersBox.innerHTML = '<div style="color:#64748b;">No orders yet. Message the WhatsApp bot or create an order in the Expo Go app!</div>';
        } else {
          ordersBox.innerHTML = data.orders.map(o =>
            '<div class="order-item">' +
            '<div class="order-head"><span>#' + o.id.toUpperCase() + ' · ' + o.category + '</span><span>' + o.status + (o.progressStep ? ' (' + o.progressStep + ')' : '') + '</span></div>' +
            '<div>' + (o.edgeCaseInstructions || '') + '</div>' +
            '<div class="meta">Agreed Fee: ₹' + (o.agreedFee || 0) + ' | Advance Due: ₹' + (o.totalAdvancePayable || o.advanceAmount || 0) + ' | Approved Purchase Cap: ₹' + (o.approvedPurchaseBudget || 0) + ' | Store Bill: ₹' + (o.storeBillAmount || 0) + ' | Refund Credit: ₹' + (o.unusedPurchaseRefund || 0) + '</div>' +
            '</div>'
          ).join('');
        }
      } catch (e) {}
    }

    document.getElementById('chatForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('msgInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '919876543210', text, name: 'Arjun' })
      });
      refresh();
    });

    setInterval(refresh, 1000);
    refresh();
  </script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight for Expo Go / Web
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    // 1. Live Web Console
    if (req.method === 'GET' && url.pathname === '/') {
      const html = renderStatusPageHtml(getLanIpAddresses());
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // 2. Status & Message History API
    if (req.method === 'GET' && url.pathname === '/api/status') {
      return sendJson(res, 200, {
        ok: true,
        waConnectionStatus,
        connectedPhone: connectedPhoneJid ? jidToCleanPhone(connectedPhoneJid) : null,
        qr: latestQrString,
        orders: engine.getOrdersList(),
        messages: engine.messageHistory.slice(-100),
      });
    }

    // 3. Polled by Expo Go App (`useSimulator` hook) every 1.2s
    if (req.method === 'GET' && url.pathname === '/api/orders') {
      return sendJson(res, 200, {
        ok: true,
        orders: engine.getOrdersList(),
      });
    }

    // 4. Pushed by Expo Go App (`src/store/index.ts`) whenever any store action runs
    if (req.method === 'POST' && url.pathname === '/api/sync-from-app') {
      const body = await readJsonBody(req);
      const result = await engine.handleSyncFromApp(body);
      return sendJson(res, 200, {
        ok: true,
        ...result,
        orders: engine.getOrdersList(),
      });
    }

    // 5. Direct WhatsApp Message Endpoint (for Web Console / Automated Testing)
    if (req.method === 'POST' && url.pathname === '/api/whatsapp/send') {
      const body = await readJsonBody(req);
      const phone = body.phone || '919876543210';
      const text = body.text || '';
      const name = body.name || 'Customer';
      const replies = await engine.handleIncomingMessage(phone, text, name);
      return sendJson(res, 200, {
        ok: true,
        replies,
        orders: engine.getOrdersList(),
      });
    }

    // 6. Meta Cloud API / Twilio Webhook Compatibility
    if (req.method === 'GET' && url.pathname === '/webhook/whatsapp') {
      const challenge = url.searchParams.get('hub.challenge') || 'OK';
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      return res.end(challenge);
    }

    if (req.method === 'POST' && url.pathname === '/webhook/whatsapp') {
      const body = await readJsonBody(req);
      // Support both Meta Cloud API format and Twilio format
      const metaMsg =
        body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      const metaContact =
        body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];

      const phone = metaMsg?.from || body?.From || '919876543210';
      const text =
        metaMsg?.text?.body || body?.Body || '';
      const name = metaContact?.profile?.name || body?.ProfileName || 'Customer';

      if (text) {
        await engine.handleIncomingMessage(phone, text, name);
      }
      return sendJson(res, 200, { status: 'received' });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    console.error('Server error:', err);
    return sendJson(res, 500, { error: err.message });
  }
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    const lanIps = getLanIpAddresses();
    console.log('\n┌────────────────────────────────────────────────────────────────────┐');
    console.log('│      TASKGO KOZHIKODE — WHATSAPP BOT & EXPO GO BRIDGE SERVER      │');
    console.log('└────────────────────────────────────────────────────────────────────┘');
    console.log(`🌐 Local Web Console:       http://localhost:${PORT}`);
    lanIps.forEach((ip) => {
      console.log(`📱 Expo Go LAN Bridge URL:  http://${ip}:${PORT}`);
    });
    console.log('──────────────────────────────────────────────────────────────────────');
    void startRealWhatsAppConnection();
  });
}

module.exports = { server, engine };