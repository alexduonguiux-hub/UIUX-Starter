// Server: phục vụ giao diện (Vite khi dev, thư mục dist khi chạy thật) và đồng bộ trò chơi qua Socket.io.
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";
import { Server } from "socket.io";
import { Room } from "./room.js";

const dev = process.argv.includes("--dev");
const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
/** Phòng không hoạt động quá thời gian này sẽ bị xoá. */
const ROOM_TTL_MS = 4 * 60 * 60 * 1000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: dev ? { origin: true } : undefined, pingInterval: 10000, pingTimeout: 8000 });

/** @type {Map<string, Room>} */
const rooms = new Map();

/** Địa chỉ mạng LAN của máy chủ, để điện thoại cùng Wi‑Fi vào được khi chạy trên laptop. */
function lanUrls() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === "IPv4" && !net.internal)
    .map((net) => `http://${net.address}:${PORT}`);
}

app.disable("x-powered-by");
app.get("/healthz", (_req, res) => res.json({ ok: true, rooms: rooms.size }));
app.get("/api/info", (_req, res) => {
  res.json({ publicUrl: process.env.PUBLIC_URL?.replace(/\/$/, "") || null, lanUrls: lanUrls() });
});

if (dev) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({ root: ROOT, server: { middlewareMode: true, hmr: { server: httpServer } }, appType: "spa" });
  app.use(vite.middlewares);
} else {
  const dist = path.join(ROOT, "dist");
  app.use("/assets", express.static(path.join(dist, "assets"), { immutable: true, maxAge: "1y" }));
  app.use(express.static(dist, { index: false, maxAge: "1h" }));
  app.use((_req, res) => res.sendFile(path.join(dist, "index.html")));
}

/* ── Phòng chơi ─────────────────────────────────────── */

function newPin() {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const pin = String(1000 + Math.floor(Math.random() * 9000));
    if (!rooms.has(pin)) return pin;
  }
  return String(10000 + Math.floor(Math.random() * 90000));
}

/** Gom nhiều thay đổi liên tiếp thành một lần gửi trạng thái (tối đa ~12 lần/giây). */
function scheduleBroadcast(room) {
  if (room.broadcastTimer) return;
  room.broadcastTimer = setTimeout(() => {
    room.broadcastTimer = null;
    io.to(`host:${room.pin}`).emit("host:state", room.hostView());
    for (const player of room.players.values()) {
      if (player.connected) io.to(`player:${room.pin}:${player.id}`).emit("player:state", room.playerView(player.id));
    }
  }, 80);
}

function createRoom(settings) {
  const pin = newPin();
  const room = new Room({ pin, settings, onChange: () => scheduleBroadcast(room) });
  rooms.set(pin, room);
  return room;
}

setInterval(() => {
  const cutoff = Date.now() - ROOM_TTL_MS;
  for (const [pin, room] of rooms) {
    if (room.touchedAt < cutoff) {
      room.dispose();
      rooms.delete(pin);
    }
  }
}, 10 * 60 * 1000).unref();

/* ── Socket ─────────────────────────────────────────── */

const reply = (ack, value) => {
  if (typeof ack === "function") ack(value);
};

/** Số kết nối socket đang mở của từng người chơi (một người có thể mở nhiều tab). */
const playerSockets = new Map();

function attachPlayer(socket, room, player) {
  socket.data = { role: "player", pin: room.pin, playerId: player.id };
  socket.join(`player:${room.pin}:${player.id}`);
  const key = `${room.pin}:${player.id}`;
  playerSockets.set(key, (playerSockets.get(key) ?? 0) + 1);
  room.setConnected(player.id, true);
  socket.emit("player:state", room.playerView(player.id));
}

io.on("connection", (socket) => {
  socket.data = {};

  const hostRoom = (payload) => {
    const room = rooms.get(String(payload?.pin ?? ""));
    if (!room || room.hostKey !== payload?.hostKey) return null;
    return room;
  };

  socket.on("host:create", (payload, ack) => {
    const room = createRoom(payload?.settings);
    socket.data = { role: "host", pin: room.pin };
    socket.join(`host:${room.pin}`);
    reply(ack, { ok: true, pin: room.pin, hostKey: room.hostKey });
    socket.emit("host:state", room.hostView());
  });

  socket.on("host:resume", (payload, ack) => {
    const room = hostRoom(payload);
    if (!room) return reply(ack, { error: "not-found" });
    socket.data = { role: "host", pin: room.pin };
    socket.join(`host:${room.pin}`);
    reply(ack, { ok: true });
    socket.emit("host:state", room.hostView());
  });

  socket.on("host:action", (payload, ack) => {
    const room = hostRoom(payload);
    if (!room) return reply(ack, { error: "Không tìm thấy phòng." });
    const { action, playerId } = payload;
    let result = { ok: true };
    if (action === "next") result = room.next();
    else if (action === "skip") result = room.skip();
    else if (action === "shuffle") room.shuffleTeams();
    else if (action === "restart") room.restart();
    else if (action === "finish") result = room.finish();
    else if (action === "kick") {
      room.remove(String(playerId));
      io.to(`player:${room.pin}:${playerId}`).emit("player:kicked");
    } else result = { error: "Hành động không hợp lệ." };
    reply(ack, result);
  });

  socket.on("room:peek", (payload, ack) => {
    const room = rooms.get(String(payload?.pin ?? ""));
    reply(ack, room ? { ok: true, room: room.peek() } : { error: "not-found" });
  });

  socket.on("player:join", (payload, ack) => {
    const room = rooms.get(String(payload?.pin ?? ""));
    if (!room) return reply(ack, { error: "Không tìm thấy phòng. Kiểm tra lại mã phòng nhé." });
    const result = room.join({ name: payload?.name, teamId: payload?.teamId, avatar: payload?.avatar, fact: payload?.fact });
    if (result.error) return reply(ack, { error: result.error });
    reply(ack, { ok: true, playerId: result.player.id, name: result.player.name });
    attachPlayer(socket, room, result.player);
  });

  socket.on("player:resume", (payload, ack) => {
    const room = rooms.get(String(payload?.pin ?? ""));
    const player = room?.players.get(String(payload?.playerId ?? ""));
    if (!room || !player) return reply(ack, { error: "not-found" });
    reply(ack, { ok: true, name: player.name });
    attachPlayer(socket, room, player);
  });

  const playerContext = () => {
    const { role, pin, playerId } = socket.data ?? {};
    if (role !== "player") return null;
    const room = rooms.get(pin);
    return room?.players.has(playerId) ? { room, playerId } : null;
  };

  socket.on("player:team", (payload, ack) => {
    const ctx = playerContext();
    if (!ctx) return reply(ack, { error: "Bạn chưa vào phòng." });
    reply(ack, ctx.room.setTeam(ctx.playerId, String(payload?.teamId ?? "")));
  });

  socket.on("player:profile", (payload, ack) => {
    const ctx = playerContext();
    if (!ctx) return reply(ack, { error: "Bạn chưa vào phòng." });
    reply(ack, ctx.room.setProfile(ctx.playerId, { avatar: payload?.avatar, fact: payload?.fact }));
  });

  socket.on("player:answer", (payload, ack) => {
    const ctx = playerContext();
    if (!ctx) return reply(ack, { error: "Bạn chưa vào phòng." });
    reply(ack, ctx.room.answer(ctx.playerId, payload?.stepId, payload?.choice));
  });

  socket.on("player:move", (payload, ack) => {
    const ctx = playerContext();
    if (!ctx) return reply(ack, { error: "Bạn chưa vào phòng." });
    reply(ack, ctx.room.challengeMove(ctx.playerId, payload?.stepId, payload?.move));
  });

  socket.on("player:leave", (_payload, ack) => {
    const ctx = playerContext();
    if (ctx) {
      ctx.room.remove(ctx.playerId);
      playerSockets.delete(`${ctx.room.pin}:${ctx.playerId}`);
      socket.leave(`player:${ctx.room.pin}:${ctx.playerId}`);
    }
    socket.data = {};
    reply(ack, { ok: true });
  });

  socket.on("disconnect", () => {
    const { role, pin, playerId } = socket.data ?? {};
    if (role !== "player") return;
    const key = `${pin}:${playerId}`;
    const left = (playerSockets.get(key) ?? 1) - 1;
    if (left > 0) return void playerSockets.set(key, left);
    playerSockets.delete(key);
    rooms.get(pin)?.setConnected(playerId, false);
  });
});

httpServer.listen(PORT, () => {
  const urls = [`http://localhost:${PORT}`, ...lanUrls()];
  console.log(`UIUX Warm-up đang chạy${dev ? " (dev)" : ""}:\n${urls.map((u) => `  ${u}`).join("\n")}`);
});
