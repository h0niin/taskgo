'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const PORT = Number(process.env.TASKGO_ADMIN_PORT || 3002);
const BOT_BRIDGE_URL = process.env.TASKGO_BOT_BRIDGE_URL || 'http://127.0.0.1:3001';
const DATA_PATH = path.join(__dirname, '.taskgo-admin-orders.json');
const DASHBOARD_PATH = path.join(__dirname, 'admin-dashboard.html');
const RUNNERS = [
  { id: 'u_run_1', name: 'Rahul Das', phone: '9567891234', role: 'TASKBOY' },
  { id: 'u_run_2', name: 'Vishnu Krishnan', phone: '9562341234', role: 'TASKBOY' },
  { id: 'u_run_3', name: 'Sreekanth P', phone: '9544219876', role: 'TASKBOY' },
];
const onlineHeartbeats = new Map();
const orders = new Map();

try {
  const stored = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  if (Array.isArray(stored)) for (const order of stored) if (order && order.id) orders.set(order.id, order);
} catch { /* first run */ }

function persistOrders() {
  const temporary = `${DATA_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify([...orders.values()], null, 2));
  fs.renameSync(temporary, DATA_PATH);
}

function json(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch { reject(new Error('Request body must be valid JSON')); }
    });
    req.on('error', reject);
  });
}

function getRunnerStatus() {
  const now = Date.now();
  return RUNNERS.map(runner => {
    const heartbeat = onlineHeartbeats.get(runner.id);
    const busyOrder = [...orders.values()].find(order => order.assignedRunnerId === runner.id && !['COMPLETED', 'CANCELLED'].includes(order.status));
    return {
      ...runner,
      online: Boolean(heartbeat && heartbeat.online && now - heartbeat.at < 60_000),
      lastSeenAt: heartbeat?.at ? new Date(heartbeat.at).toISOString() : null,
      currentOrderId: busyOrder?.id || null,
      currentOrderStatus: busyOrder?.status || null,
    };
  });
}

async function getBotOrders() {
  try {
    const response = await fetch(`${BOT_BRIDGE_URL}/api/orders`, { signal: AbortSignal.timeout(900) });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload.orders) ? payload.orders : [];
  } catch { return []; }
}

async function allOrders() {
  const merged = new Map(orders);
  for (const order of await getBotOrders()) {
    if (!order?.id) continue;
    const local = merged.get(order.id);
    const localTime = Date.parse(local?.updatedAt || local?.createdAt || '') || 0;
    const remoteTime = Date.parse(order.updatedAt || order.createdAt || '') || 0;
    if (!local || remoteTime >= localTime) merged.set(order.id, order);
  }
  return [...merged.values()].sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
}

function validateNewOrder(body) {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (typeof body.category !== 'string' || !body.category.trim()) return 'Choose a task category';
  if (typeof body.itemsSummary !== 'string' || !body.itemsSummary.trim()) return 'Describe what needs doing';
  if (typeof body.pickup !== 'string' || !body.pickup.trim()) return 'Pickup location is required';
  if (typeof body.dropoff !== 'string' || !body.dropoff.trim()) return 'Drop-off location is required';
  if (!RUNNERS.some(runner => runner.id === body.runnerId)) return 'Choose a valid taskboy';
  if (!Number.isFinite(body.fee) || body.fee <= 0) return 'Fixed fee must be a positive amount';
  return null;
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/') {
    const page = fs.readFileSync(DASHBOARD_PATH);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(page);
  }
  if (req.method === 'GET' && url.pathname === '/api/admin/overview') {
    const currentOrders = await allOrders();
    const runnerOrderMap = new Map(currentOrders.map(order => [order.id, order]));
    for (const [id, order] of runnerOrderMap) if (order.sourceChannel === 'WHATSAPP' && !orders.has(id)) orders.set(id, order);
    return json(res, 200, { ok: true, orders: currentOrders, runners: getRunnerStatus(), serverTime: new Date().toISOString() });
  }
  if (req.method === 'GET' && url.pathname === '/api/orders') {
    return json(res, 200, { ok: true, orders: await allOrders(), runners: getRunnerStatus() });
  }
  if (req.method === 'POST' && url.pathname === '/api/runners/heartbeat') {
    const body = await readBody(req);
    if (!RUNNERS.some(runner => runner.id === body.runnerId)) return json(res, 400, { error: 'Unknown taskboy' });
    onlineHeartbeats.set(body.runnerId, { online: body.online !== false, at: Date.now() });
    return json(res, 200, { ok: true, runners: getRunnerStatus() });
  }
  if (req.method === 'POST' && url.pathname === '/api/orders/sync') {
    const body = await readBody(req);
    if (!Array.isArray(body.orders)) return json(res, 400, { error: 'orders must be an array' });
    for (const incoming of body.orders) {
      if (!incoming || typeof incoming.id !== 'string' || !incoming.id) continue;
      const existing = orders.get(incoming.id);
      if (existing && existing.sourceChannel === 'WHATSAPP' && incoming.sourceChannel !== 'WHATSAPP') continue;
      const copy = { ...incoming, updatedAt: incoming.updatedAt || new Date().toISOString() };
      orders.set(copy.id, copy);
    }
    persistOrders();
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && url.pathname === '/api/admin/orders') {
    const body = await readBody(req);
    const problem = validateNewOrder(body);
    if (problem) return json(res, 400, { error: problem });
    const runner = RUNNERS.find(candidate => candidate.id === body.runnerId);
    const createdAt = new Date().toISOString();
    const order = {
      id: `ord_admin_${crypto.randomUUID().slice(0, 8)}`,
      customerId: 'u_cust_1',
      category: body.category.trim(),
      itemsSummary: body.itemsSummary.trim(),
      stops: [
        { id: `stp_${crypto.randomUUID().slice(0, 8)}`, type: 'PICKUP', address: body.pickup.trim() },
        { id: `stp_${crypto.randomUUID().slice(0, 8)}`, type: 'DROPOFF', address: body.dropoff.trim() },
      ],
      edgeCaseInstructions: body.instructions?.trim() || body.itemsSummary.trim(),
      status: 'ASSIGNED',
      progressStep: undefined,
      distanceKm: 2,
      createdAt,
      updatedAt: createdAt,
      threads: [],
      payments: [],
      assignedRunnerId: runner.id,
      assignedRunnerName: runner.name,
      agreedFee: Math.round(body.fee),
      assignmentMode: 'ADMIN_FIXED',
      sourceChannel: 'ADMIN',
    };
    orders.set(order.id, order);
    persistOrders();
    return json(res, 201, { ok: true, order, orders: await allOrders() });
  }
  const cancelMatch = url.pathname.match(/^\/api\/admin\/orders\/([^/]+)\/cancel$/);
  if (req.method === 'POST' && cancelMatch) {
    const id = decodeURIComponent(cancelMatch[1]);
    const order = orders.get(id);
    if (!order) return json(res, 404, { error: 'Task not found on admin server' });
    if (['COMPLETED', 'CANCELLED'].includes(order.status)) return json(res, 409, { error: `Task is already ${order.status.toLowerCase()}` });
    const updated = { ...order, status: 'CANCELLED', updatedAt: new Date().toISOString() };
    orders.set(id, updated);
    persistOrders();
    return json(res, 200, { ok: true, order: updated, orders: await allOrders() });
  }
  return json(res, 404, { error: 'Not found' });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(error => {
    console.error('[TaskGo Admin]', error);
    if (!res.headersSent) json(res, 500, { error: 'Internal server error' });
    else res.destroy();
  });
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TaskGo Admin: http://localhost:${PORT}`);
    for (const interfaces of Object.values(os.networkInterfaces())) {
      for (const network of interfaces || []) if (network.family === 'IPv4' && !network.internal) console.log(`LAN: http://${network.address}:${PORT}`);
    }
    console.log(`WhatsApp bridge proxy: ${BOT_BRIDGE_URL}`);
  });
}

module.exports = { server, orders, RUNNERS };
