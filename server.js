const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const html = fs.readFileSync(path.join(__dirname, "public", "index.html"));
const rooms = new Map();
const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") { res.writeHead(200); return res.end("ok"); }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
  res.end(html);
});

const wss = new WebSocketServer({ server, maxPayload: 4096 });
const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
const clean = (s) => String(s || "Mateador").replace(/[<>&"'`]/g, "").slice(0, 12) || "Mateador";

function newCode() {
  for (;;) {
    let c = "";
    for (let i = 0; i < 4; i++) c += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    if (!rooms.has(c)) return c;
  }
}
function other(ws) {
  const r = rooms.get(ws.code);
  return r ? r.p[1 - ws.seat] : null;
}
function leaveRoom(ws) {
  const r = rooms.get(ws.code);
  if (!r) return;
  const o = r.p[1 - ws.seat];
  send(o, { t: "gone" });
  rooms.delete(ws.code);
  if (o) o.code = null;
}

wss.on("connection", (ws) => {
  ws.alive = true; ws.count = 0; ws.code = null;
  ws.on("pong", () => { ws.alive = true; });
  ws.on("message", (raw) => {
    if (++ws.count > 40) return; // límite por segundo
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.t === "create" && !ws.code) {
      const code = newCode();
      ws.code = code; ws.seat = 0; ws.name = clean(m.name);
      rooms.set(code, { p: [ws, null], born: Date.now() });
      send(ws, { t: "created", code });
    } else if (m.t === "join" && !ws.code) {
      const code = String(m.code || "").toLowerCase().slice(0, 4);
      const r = rooms.get(code);
      if (!r || r.p[1]) return send(ws, { t: "err", msg: "Sala no encontrada o llena." });
      ws.code = code; ws.seat = 1; ws.name = clean(m.name);
      r.p[1] = ws;
      send(r.p[0], { t: "start", seat: 0, opp: ws.name, code });
      send(ws, { t: "start", seat: 1, opp: r.p[0].name, code });
    } else if (m.t === "st" && ws.code) {
      const o = other(ws);
      if (!o || typeof m.m !== "object" || m.m === null) return;
      if (JSON.stringify(m.m).length > 1500) return;
      const rd = Math.max(0, Math.min(6, m.rd | 0));
      send(o, { t: "opp", m: m.m, rd });
    }
  });
  ws.on("close", () => leaveRoom(ws));
  ws.on("error", () => {});
});

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.alive) return ws.terminate();
    ws.alive = false; ws.ping();
  });
  const now = Date.now();
  rooms.forEach((r, c) => { if (!r.p[1] && now - r.born > 600000) { r.p[0].close(); rooms.delete(c); } });
}, 1000 * 15);

setInterval(() => wss.clients.forEach((ws) => { ws.count = 0; }), 1000);

server.listen(PORT, () => console.log("Ronda de Mates en puerto " + PORT));
