// Một phòng chơi: người chơi, team, các bước của buổi chơi, điểm số và trạng thái gửi cho từng màn hình.
import { randomBytes, randomUUID } from "node:crypto";
import { AB, ESTIMATES, POLLS, QUIZ, REBUS, TRUTHS } from "../shared/content.js";
import {
  AVATARS,
  CENTER_ROUNDS,
  CHALLENGE_LEAD_MS,
  COLOR_MISS_LOCK_MS,
  COLOR_POINTS,
  FACT_MAX,
  GAMES,
  GAME_ORDER,
  MAX_TEAMS,
  MEMORY_PAIRS,
  MEMORY_POINTS,
  MEMORY_TIME_BONUS,
  MIN_TEAMS,
  NAME_MAX,
  PACKS,
  POLL_POINTS,
  REACTION_ROUNDS,
  TAP_MAX_RATE,
  TAP_POINTS,
  TEAM_PRESETS,
  WHOIS_AUTHOR_POINTS,
  answerPoints,
  centerPoints,
  centerTargets,
  colorLevel,
  estimatePoints,
  memoryDeck,
  reactionPoints,
  shuffle,
} from "../shared/games.js";

/** Số câu tối đa mỗi trò hỏi đáp (theo nội dung đang có). */
export const LIMITS = {
  poll: POLLS.length,
  whois: 10,
  truth: TRUTHS.length,
  rebus: REBUS.length,
  estimate: ESTIMATES.length,
  quiz: QUIZ.length,
  ab: AB.length,
  reaction: 1,
  tap: 1,
  memory: 1,
  color: 1,
  center: 1,
};
/** Câu hỏi lấy từ danh sách nội dung có sẵn (Ai là ai? lấy từ học viên). */
const POOLS = { poll: POLLS, truth: TRUTHS, rebus: REBUS, estimate: ESTIMATES, quiz: QUIZ, ab: AB };
/** Thời gian chờ thêm cho câu trả lời đến muộn do mạng. */
const GRACE_MS = 600;
const TOP_FOR_PLAYERS = 5;

const clampInt = (value, min, max, fallback) => {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return fallback;
  return Math.min(max, Math.max(min, number));
};

/** Kiểm tra và chuẩn hoá cài đặt phòng gửi lên từ trình duyệt. */
export function normalizeSettings(input = {}) {
  const pack = ["quick", "full", "active", "uiux", "custom"].includes(input.pack) ? input.pack : "quick";
  const source = pack === "custom" ? input.games ?? {} : PACKS[pack].games;
  const games = {};
  for (const id of GAME_ORDER) games[id] = clampInt(source[id], 0, LIMITS[id], 0);
  if (GAME_ORDER.every((id) => games[id] === 0)) Object.assign(games, PACKS.quick.games);
  return {
    mode: input.mode === "solo" ? "solo" : "team",
    teamCount: clampInt(input.teamCount, MIN_TEAMS, MAX_TEAMS, 4),
    assign: input.assign === "choose" ? "choose" : "auto",
    teamScore: input.teamScore === "sum" ? "sum" : "avg",
    pack,
    games,
  };
}

/** Chuẩn hoá tên: bỏ khoảng trắng thừa, tối đa NAME_MAX ký tự. */
export function cleanName(name) {
  return String(name ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, NAME_MAX);
}

/** Chuẩn hoá "điều thú vị về bạn": một dòng, tối đa FACT_MAX ký tự. */
export function cleanFact(fact) {
  return String(fact ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, FACT_MAX);
}

/** Xếp hạng có đồng hạng: cùng điểm thì cùng hạng. */
function rankBy(items, score) {
  const sorted = items.slice().sort((a, b) => score(b) - score(a) || String(a.name).localeCompare(String(b.name), "vi"));
  let rank = 0;
  let previous = null;
  return sorted.map((item, index) => {
    const value = score(item);
    if (value !== previous) rank = index + 1;
    previous = value;
    return { item, rank };
  });
}

export class Room {
  /**
   * @param {{ pin: string, settings?: object, onChange?: () => void, now?: () => number, random?: () => number }} options
   */
  constructor({ pin, settings, onChange = () => {}, now = Date.now, random = Math.random }) {
    this.pin = pin;
    this.hostKey = randomBytes(12).toString("base64url");
    this.settings = normalizeSettings(settings);
    this.onChange = onChange;
    this.now = now;
    this.random = random;
    this.createdAt = now();
    this.touchedAt = this.createdAt;
    this.teams = this.settings.mode === "team" ? TEAM_PRESETS.slice(0, this.settings.teamCount) : [];
    /** @type {Map<string, any>} */
    this.players = new Map();
    this.steps = [];
    this.stepIndex = -1;
    this.phase = "lobby";
    this.current = null;
    this.timer = null;
  }

  touch() {
    this.touchedAt = this.now();
    this.onChange();
  }

  dispose() {
    clearTimeout(this.timer);
  }

  /* ── Người chơi và team ─────────────────────────────── */

  teamSizes() {
    const sizes = new Map(this.teams.map((team) => [team.id, 0]));
    for (const player of this.players.values()) if (sizes.has(player.teamId)) sizes.set(player.teamId, sizes.get(player.teamId) + 1);
    return sizes;
  }

  /** Team ít người nhất (bốc ngẫu nhiên nếu bằng nhau). */
  smallestTeam() {
    const sizes = this.teamSizes();
    const fewest = Math.min(...sizes.values());
    const candidates = this.teams.filter((team) => sizes.get(team.id) === fewest);
    return candidates[Math.floor(this.random() * candidates.length)].id;
  }

  uniqueName(name, exceptId) {
    const taken = new Set([...this.players.values()].filter((p) => p.id !== exceptId).map((p) => p.name.toLocaleLowerCase("vi")));
    if (!taken.has(name.toLocaleLowerCase("vi"))) return name;
    for (let n = 2; ; n += 1) {
      const candidate = `${name.slice(0, NAME_MAX - String(n).length - 1)} ${n}`;
      if (!taken.has(candidate.toLocaleLowerCase("vi"))) return candidate;
    }
  }

  /** Học viên vào phòng. Trả về người chơi, hoặc { error }. */
  join({ name, teamId, avatar, fact }) {
    const clean = cleanName(name);
    if (!clean) return { error: "Hãy nhập tên của bạn." };
    if (this.players.size >= 300) return { error: "Phòng đã đủ người." };
    let team = null;
    if (this.settings.mode === "team") {
      const wanted = this.settings.assign === "choose" && this.teams.some((t) => t.id === teamId) ? teamId : null;
      team = wanted ?? this.smallestTeam();
    }
    const player = {
      id: randomUUID(),
      name: this.uniqueName(clean),
      avatar: AVATARS.includes(avatar) ? avatar : AVATARS[Math.floor(this.random() * AVATARS.length)],
      fact: cleanFact(fact),
      teamId: team,
      score: 0,
      streak: 0,
      connected: true,
      joinedAt: this.now(),
      last: null,
    };
    this.players.set(player.id, player);
    this.touch();
    return { player };
  }

  setConnected(playerId, connected) {
    const player = this.players.get(playerId);
    if (!player || player.connected === connected) return;
    player.connected = connected;
    this.touch();
    if (!connected) this.maybeFinishEarly();
  }

  /** Học viên đổi team (chỉ khi phòng cho tự chọn và chưa bắt đầu). */
  setTeam(playerId, teamId) {
    const player = this.players.get(playerId);
    if (!player) return { error: "Không tìm thấy bạn trong phòng." };
    if (this.settings.assign !== "choose" || this.phase !== "lobby") return { error: "Lúc này không đổi team được." };
    if (!this.teams.some((team) => team.id === teamId)) return { error: "Team không tồn tại." };
    player.teamId = teamId;
    this.touch();
    return { ok: true };
  }

  /** Học viên đổi avatar hoặc "điều thú vị" (điều thú vị chỉ đổi được trước khi bắt đầu). */
  setProfile(playerId, { avatar, fact } = {}) {
    const player = this.players.get(playerId);
    if (!player) return { error: "Không tìm thấy bạn trong phòng." };
    if (avatar !== undefined) {
      if (!AVATARS.includes(avatar)) return { error: "Avatar không hợp lệ." };
      player.avatar = avatar;
    }
    if (fact !== undefined) {
      if (this.phase !== "lobby") return { error: "Trò chơi đã bắt đầu, không đổi được nữa." };
      player.fact = cleanFact(fact);
    }
    this.touch();
    return { ok: true };
  }

  remove(playerId) {
    if (!this.players.delete(playerId)) return false;
    this.current?.answers?.delete(playerId);
    this.current?.challenge?.delete(playerId);
    this.touch();
    this.maybeFinishEarly();
    return true;
  }

  /** Chia lại team ngẫu nhiên, đều số người. */
  shuffleTeams() {
    if (this.settings.mode !== "team") return;
    const ids = shuffle(this.teams.map((t) => t.id), this.random);
    shuffle([...this.players.values()], this.random).forEach((player, index) => {
      player.teamId = ids[index % ids.length];
    });
    this.touch();
  }

  /* ── Các bước của buổi chơi ─────────────────────────── */

  buildSteps() {
    const steps = [];
    let section = 0;
    for (const game of GAME_ORDER) {
      const count = this.settings.games[game];
      if (!count) continue;
      // "Ai là ai?" cần ít nhất 2 người và 1 điều thú vị; thiếu thì bỏ qua phần này.
      if (game === "whois" && this.whoisItems(count).length === 0) continue;
      section += 1;
      steps.push({ id: `s${steps.length}`, kind: "intro", game, section });
      if (GAMES[game].kind === "challenge") {
        steps.push({ id: `s${steps.length}`, kind: "challenge", game, section, seed: randomBytes(6).toString("hex"), seconds: GAMES[game].seconds });
        continue;
      }
      const items = game === "whois" ? this.whoisItems(count) : shuffle(POOLS[game], this.random).slice(0, count);
      items.forEach((item, index) => {
        steps.push({ id: `s${steps.length}`, kind: "question", game, section, number: index + 1, total: items.length, seconds: GAMES[game].seconds, ...this.prepareItem(game, item) });
      });
    }
    return steps;
  }

  /** Câu hỏi "Ai là ai?": mỗi câu là điều thú vị của một bạn, đáp án là tên bạn đó và tối đa 3 bạn khác. */
  whoisItems(count) {
    const everyone = [...this.players.values()];
    if (everyone.length < 2) return [];
    const authors = shuffle(everyone.filter((p) => p.fact), this.random).slice(0, count);
    return authors.map((author) => {
      const others = shuffle(everyone.filter((p) => p.id !== author.id), this.random).slice(0, 3);
      const choices = shuffle([author, ...others], this.random);
      return { author, choices };
    });
  }

  /** Câu hỏi: phần công khai (prompt, options) và phần bí mật (answer) cho tới lúc công bố. */
  prepareItem(game, item) {
    if (game === "whois") {
      return {
        prompt: "Ai đã viết điều này?",
        options: item.choices.map((p) => p.name),
        optionArt: item.choices.map((p) => p.avatar),
        answer: item.choices.findIndex((p) => p.id === item.author.id),
        authorId: item.author.id,
        visual: { type: "quote", text: item.author.fact },
        explain: `Đó là ${item.author.name}! Hãy hỏi thêm bạn ấy trong giờ nghỉ nhé.`,
      };
    }
    if (game === "truth") {
      return {
        prompt: item.statement,
        options: ["Thật", "Đùa"],
        optionArt: ["✅", "🙅"],
        answer: item.truth ? 0 : 1,
        explain: item.explain,
        visual: { type: "emoji", text: item.emoji, caption: "" },
      };
    }
    if (game === "estimate") {
      return {
        prompt: item.prompt,
        options: [],
        range: { min: item.min, max: item.max, step: item.step, unit: item.unit },
        answer: item.answer,
        explain: item.explain ?? null,
        visual: { type: "emoji", text: item.emoji, caption: "" },
      };
    }
    if (game === "rebus") {
      return { prompt: `Đoán ${item.category.toLocaleLowerCase("vi")}`, options: item.options.slice(), answer: item.answer, explain: item.explain ?? null, visual: { type: "emoji", text: item.emoji, caption: item.category } };
    }
    if (game === "ab") {
      const goodFirst = this.random() < 0.5;
      const good = { svg: item.good, alt: item.goodAlt };
      const bad = { svg: item.bad, alt: item.badAlt };
      return {
        prompt: item.prompt,
        options: ["Phương án A", "Phương án B"],
        images: goodFirst ? [good, bad] : [bad, good],
        answer: goodFirst ? 0 : 1,
        explain: item.explain,
        principle: item.principle,
      };
    }
    if (game === "poll") return { prompt: item.prompt, options: item.options.map((o) => o.label), optionArt: item.options.map((o) => o.emoji), answer: null };
    return { prompt: item.prompt, options: item.options.slice(), answer: item.answer, explain: item.explain, visual: item.visual ?? null };
  }

  get step() {
    return this.steps[this.stepIndex] ?? null;
  }

  /** Bắt đầu (hoặc chơi lại): tạo bước chơi mới. */
  start() {
    if (this.phase !== "lobby") return { error: "Phòng đã bắt đầu." };
    if (this.players.size === 0) return { error: "Chưa có học viên nào trong phòng." };
    this.steps = this.buildSteps();
    this.goto(0);
    return { ok: true };
  }

  /** Về phòng chờ, xoá điểm, giữ nguyên người chơi và team. */
  restart() {
    clearTimeout(this.timer);
    for (const player of this.players.values()) Object.assign(player, { score: 0, streak: 0, last: null });
    this.steps = [];
    this.stepIndex = -1;
    this.phase = "lobby";
    this.current = null;
    this.touch();
  }

  goto(index) {
    clearTimeout(this.timer);
    this.stepIndex = index;
    const step = this.step;
    if (!step) {
      this.phase = "final";
      this.current = null;
      this.touch();
      return;
    }
    const now = this.now();
    if (step.kind === "intro") {
      this.phase = "intro";
      this.current = { stepId: step.id };
    } else if (step.kind === "question") {
      this.phase = "question";
      this.current = { stepId: step.id, startsAt: now, endsAt: now + step.seconds * 1000, answers: new Map(), counts: null };
      this.timer = setTimeout(() => this.reveal(), step.seconds * 1000 + GRACE_MS);
    } else {
      this.phase = "challenge";
      const startsAt = now + CHALLENGE_LEAD_MS;
      this.current = { stepId: step.id, startsAt, endsAt: startsAt + step.seconds * 1000, challenge: new Map() };
      this.timer = setTimeout(() => this.endChallenge(), CHALLENGE_LEAD_MS + step.seconds * 1000 + GRACE_MS);
    }
    this.touch();
  }

  /** Nút "Tiếp" của giảng viên: đi tới trạng thái kế tiếp. */
  next() {
    switch (this.phase) {
      case "lobby":
        return this.start();
      case "intro":
      case "leaderboard":
        this.goto(this.stepIndex + 1);
        return { ok: true };
      case "question":
        this.reveal();
        return { ok: true };
      case "reveal":
        this.phase = "leaderboard";
        this.touch();
        return { ok: true };
      case "challenge":
        this.endChallenge();
        return { ok: true };
      default:
        return { ok: true };
    }
  }

  /** Từ màn đáp án sang thẳng câu sau, bỏ qua bảng xếp hạng. */
  skip() {
    if (this.phase !== "reveal") return this.next();
    this.goto(this.stepIndex + 1);
    return { ok: true };
  }

  /** Kết thúc sớm: sang màn kết quả cuối. */
  finish() {
    clearTimeout(this.timer);
    this.stepIndex = this.steps.length;
    this.phase = "final";
    this.current = null;
    this.touch();
    return { ok: true };
  }

  /* ── Hỏi đáp ────────────────────────────────────────── */

  answer(playerId, stepId, choice) {
    const step = this.step;
    const player = this.players.get(playerId);
    if (!player) return { error: "Không tìm thấy bạn trong phòng." };
    if (this.phase !== "question" || step?.id !== stepId) return { error: "Câu hỏi đã đóng." };
    if (this.current.answers.has(playerId)) return { error: "Bạn đã trả lời rồi." };
    if (step.authorId === playerId) return { error: "Đây là điều bạn viết, chờ mọi người đoán nhé!" };
    if (step.range) {
      const { min, max } = step.range;
      if (typeof choice !== "number" || !Number.isFinite(choice) || choice < min || choice > max) return { error: "Con số không hợp lệ." };
    } else if (!Number.isInteger(choice) || choice < 0 || choice >= step.options.length) return { error: "Lựa chọn không hợp lệ." };
    const now = this.now();
    if (now > this.current.endsAt + GRACE_MS) return { error: "Hết giờ rồi." };
    this.current.answers.set(playerId, { choice, at: Math.min(now, this.current.endsAt) });
    this.touch();
    this.maybeFinishEarly();
    return { ok: true };
  }

  connectedPlayers() {
    return [...this.players.values()].filter((p) => p.connected);
  }

  /** Mọi người đang kết nối đã trả lời (hoặc chơi xong thử thách) thì kết thúc luôn. */
  maybeFinishEarly() {
    const online = this.connectedPlayers();
    if (online.length === 0) return;
    if (this.phase === "question" && online.every((p) => this.current.answers.has(p.id) || p.id === this.step.authorId)) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.reveal(), 400);
    }
    const rounds = this.step?.game === "center" ? CENTER_ROUNDS : this.step?.game === "reaction" ? REACTION_ROUNDS : this.step?.game === "memory" ? 1 : null;
    if (this.phase === "challenge" && rounds && online.every((p) => (this.current.challenge.get(p.id)?.round ?? 0) >= rounds)) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.endChallenge(), 1200);
    }
  }

  reveal() {
    if (this.phase !== "question") return;
    clearTimeout(this.timer);
    const step = this.step;
    const { answers } = this.current;
    const counts = step.options.map(() => 0);
    if (!step.range) for (const { choice } of answers.values()) counts[choice] += 1;
    const best = Math.max(...counts);
    const majority = step.game === "poll" && best > 0 ? counts.map((count, index) => (count === best ? index : -1)).filter((i) => i >= 0) : [];
    const limitMs = step.seconds * 1000;
    for (const player of this.players.values()) {
      const entry = answers.get(player.id);
      let correct = false;
      let points = 0;
      if (step.authorId === player.id) {
        player.score += WHOIS_AUTHOR_POINTS;
        player.last = { stepId: step.id, answered: false, author: true, choice: null, correct: false, points: WHOIS_AUTHOR_POINTS };
        continue;
      }
      if (entry && step.range) {
        points = estimatePoints(entry.choice, step.answer, step.range.min, step.range.max);
        correct = points >= 750;
      } else if (entry && step.game === "poll") {
        correct = majority.includes(entry.choice);
        points = correct ? POLL_POINTS : 0;
      } else if (entry) {
        correct = entry.choice === step.answer;
        points = answerPoints(correct, this.current.endsAt - entry.at, limitMs);
      }
      player.streak = correct ? player.streak + 1 : 0;
      player.score += points;
      player.last = { stepId: step.id, answered: Boolean(entry), choice: entry?.choice ?? null, correct, points };
    }
    this.current.counts = step.range ? null : counts;
    this.current.majority = majority;
    if (step.range) {
      const guesses = [...answers.entries()].map(([id, entry]) => ({ player: this.players.get(id), guess: entry.choice })).filter((g) => g.player);
      const ranked = guesses.sort((a, b) => Math.abs(a.guess - step.answer) - Math.abs(b.guess - step.answer));
      this.current.estimate = {
        average: guesses.length ? Math.round(guesses.reduce((sum, g) => sum + g.guess, 0) / guesses.length) : null,
        closest: ranked.slice(0, 3).map((g) => ({ id: g.player.id, name: g.player.name, avatar: g.player.avatar, guess: g.guess })),
      };
    }
    this.phase = "reveal";
    this.touch();
  }

  /* ── Thử thách ──────────────────────────────────────── */

  challengeMove(playerId, stepId, move = {}) {
    const step = this.step;
    const player = this.players.get(playerId);
    if (!player) return { error: "Không tìm thấy bạn trong phòng." };
    if (this.phase !== "challenge" || step?.id !== stepId) return { error: "Thử thách đã kết thúc." };
    const now = this.now();
    if (now < this.current.startsAt) return { error: "Chưa bắt đầu." };
    if (now > this.current.endsAt + GRACE_MS) return { error: "Hết giờ rồi." };
    const state = this.current.challenge.get(playerId) ?? { level: 0, round: 0, score: 0, misses: 0, lockedUntil: 0 };
    this.current.challenge.set(playerId, state);

    if (step.game === "color") {
      if (move.level !== state.level) return { ok: false, state: this.publicChallengeState(state) };
      if (now < state.lockedUntil - 150) return { ok: false, locked: true, state: this.publicChallengeState(state) };
      const { odd } = colorLevel(step.seed, state.level);
      const hit = move.index === odd;
      if (hit) {
        state.level += 1;
        state.score += COLOR_POINTS;
        player.score += COLOR_POINTS;
      } else {
        state.misses += 1;
        state.lockedUntil = now + COLOR_MISS_LOCK_MS;
      }
      this.touch();
      return { ok: hit, state: this.publicChallengeState(state) };
    }

    if (step.game === "tap") {
      const taps = Math.floor(Number(move.taps));
      if (!Number.isFinite(taps) || taps < 0) return { error: "Số lần bấm không hợp lệ." };
      // Không tính quá TAP_MAX_RATE lần mỗi giây kể từ lúc bắt đầu (chặn bấm bằng máy).
      const allowed = Math.floor((TAP_MAX_RATE * (Math.min(now, this.current.endsAt) - this.current.startsAt)) / 1000);
      const accepted = Math.max(0, Math.min(taps, allowed - (state.taps ?? 0)));
      state.taps = (state.taps ?? 0) + accepted;
      state.score += accepted * TAP_POINTS;
      player.score += accepted * TAP_POINTS;
      if (accepted) this.touch();
      return { ok: true, accepted, state: this.publicChallengeState(state) };
    }

    if (step.game === "memory") {
      const deck = memoryDeck(step.seed);
      const a = Number(move.a);
      const b = Number(move.b);
      state.matched = state.matched ?? [];
      const valid = Number.isInteger(a) && Number.isInteger(b) && a !== b && deck[a] !== undefined && deck[b] !== undefined;
      if (!valid || state.matched.includes(a) || state.matched.includes(b) || state.round >= 1) return { ok: false, state: this.publicChallengeState(state) };
      if (deck[a] !== deck[b]) return { ok: false, state: this.publicChallengeState(state) };
      state.matched.push(a, b);
      state.score += MEMORY_POINTS;
      player.score += MEMORY_POINTS;
      let bonus = 0;
      if (state.matched.length === MEMORY_PAIRS * 2) {
        bonus = Math.max(0, Math.ceil((this.current.endsAt - now) / 1000)) * MEMORY_TIME_BONUS;
        state.score += bonus;
        player.score += bonus;
        state.round = 1;
      }
      this.touch();
      this.maybeFinishEarly();
      return { ok: true, bonus, state: this.publicChallengeState(state) };
    }

    if (step.game === "reaction") {
      if (move.round !== state.round || state.round >= REACTION_ROUNDS) return { ok: false, state: this.publicChallengeState(state) };
      const ms = Math.round(Number(move.ms));
      const points = move.early ? 0 : reactionPoints(ms);
      state.round += 1;
      state.score += points;
      state.best = !move.early && Number.isFinite(ms) && ms > 0 ? Math.min(state.best ?? Infinity, ms) : state.best;
      player.score += points;
      this.touch();
      this.maybeFinishEarly();
      return { ok: true, points, state: this.publicChallengeState(state) };
    }

    // Pixel Perfect
    if (move.round !== state.round || state.round >= CENTER_ROUNDS) return { ok: false, state: this.publicChallengeState(state) };
    const x = Number(move.x);
    const y = Number(move.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { error: "Toạ độ không hợp lệ." };
    const target = centerTargets(step.seed)[state.round];
    const distance = Math.hypot(x - target.cx, y - target.cy);
    const points = centerPoints(distance);
    state.round += 1;
    state.score += points;
    player.score += points;
    this.touch();
    this.maybeFinishEarly();
    return { ok: true, points, distance: Math.round(distance * 10) / 10, cx: target.cx, cy: target.cy, state: this.publicChallengeState(state) };
  }

  publicChallengeState(state) {
    return {
      level: state.level,
      round: state.round,
      score: state.score,
      misses: state.misses,
      lockedUntil: state.lockedUntil,
      best: Number.isFinite(state.best) ? state.best : null,
      taps: state.taps ?? 0,
      matched: state.matched ?? [],
    };
  }

  endChallenge() {
    if (this.phase !== "challenge") return;
    clearTimeout(this.timer);
    this.phase = "leaderboard";
    this.touch();
  }

  /* ── Xếp hạng và trạng thái gửi đi ──────────────────── */

  playerRanking() {
    return rankBy([...this.players.values()], (p) => p.score);
  }

  teamRanking() {
    const stats = this.teams.map((team) => {
      const members = [...this.players.values()].filter((p) => p.teamId === team.id);
      const sum = members.reduce((total, p) => total + p.score, 0);
      const avg = members.length ? Math.round(sum / members.length) : 0;
      return { ...team, members: members.length, sum, avg, score: this.settings.teamScore === "sum" ? sum : avg };
    });
    return rankBy(stats, (team) => team.score).map(({ item, rank }) => ({ ...item, rank }));
  }

  /** Phần trạng thái giống nhau cho mọi màn hình. */
  commonView() {
    const step = this.step;
    const sections = GAME_ORDER.filter((id) => this.settings.games[id] > 0).map((id) => ({ id, title: GAMES[id].title, emoji: GAMES[id].emoji }));
    return {
      pin: this.pin,
      now: this.now(),
      phase: this.phase,
      settings: { mode: this.settings.mode, assign: this.settings.assign, teamScore: this.settings.teamScore },
      sections,
      section: step?.section ?? null,
      step: step ? this.publicStep(step) : null,
      isLastStep: this.stepIndex >= this.steps.length - 1,
      startsAt: this.current?.startsAt ?? null,
      endsAt: this.current?.endsAt ?? null,
      playerCount: this.players.size,
      factCount: [...this.players.values()].filter((p) => p.fact).length,
      answeredCount: this.current?.answers?.size ?? 0,
      teams: this.teamRanking(),
    };
  }

  /** Câu hỏi gửi đi. Đáp án chỉ có sau khi công bố. */
  publicStep(step) {
    const base = { id: step.id, kind: step.kind, game: step.game, section: step.section };
    if (step.kind === "intro") return base;
    if (step.kind === "challenge") return { ...base, seed: step.seed, seconds: step.seconds };
    const revealed = this.phase === "reveal" || this.phase === "leaderboard";
    return {
      ...base,
      number: step.number,
      total: step.total,
      seconds: step.seconds,
      prompt: step.prompt,
      options: step.options,
      optionArt: step.optionArt ?? null,
      range: step.range ?? null,
      estimate: revealed && step.range ? { answer: step.answer, ...this.current?.estimate } : null,
      images: step.images ?? null,
      visual: step.visual ?? null,
      principle: revealed ? step.principle ?? null : null,
      answer: revealed && !step.range ? step.answer : null,
      explain: revealed ? step.explain ?? null : null,
      counts: revealed ? this.current?.counts ?? null : null,
      majority: revealed ? this.current?.majority ?? [] : [],
    };
  }

  playerSummary(player, rank) {
    return { id: player.id, name: player.name, avatar: player.avatar, teamId: player.teamId, score: player.score, rank, connected: player.connected, streak: player.streak };
  }

  hostView() {
    const ranking = this.playerRanking();
    const challenge = this.current?.challenge;
    return {
      ...this.commonView(),
      role: "host",
      players: ranking.map(({ item, rank }) => ({
        ...this.playerSummary(item, rank),
        hasFact: Boolean(item.fact),
        answered: this.current?.answers?.has(item.id) ?? false,
        challengeScore: challenge?.get(item.id)?.score ?? 0,
        challengeRound: challenge?.get(item.id)?.round ?? 0,
      })),
    };
  }

  playerView(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;
    const ranking = this.playerRanking();
    const mine = ranking.find(({ item }) => item.id === playerId);
    const team = this.teamRanking().find((t) => t.id === player.teamId) ?? null;
    const stepId = this.step?.id;
    const answer = this.current?.answers?.get(playerId);
    const challenge = this.current?.challenge?.get(playerId);
    return {
      ...this.commonView(),
      role: "player",
      me: {
        ...this.playerSummary(player, mine?.rank ?? ranking.length),
        teamRank: team?.rank ?? null,
        fact: player.fact,
        isAuthor: this.step?.authorId === playerId,
        answer: answer && this.phase === "question" ? answer.choice : null,
        last: player.last?.stepId === stepId ? player.last : null,
        challenge: challenge ? this.publicChallengeState(challenge) : null,
      },
      top: ranking.slice(0, TOP_FOR_PLAYERS).map(({ item, rank }) => this.playerSummary(item, rank)),
    };
  }

  /** Thông tin xem trước trước khi vào phòng. */
  peek() {
    const sizes = this.teamSizes();
    return {
      pin: this.pin,
      phase: this.phase,
      mode: this.settings.mode,
      assign: this.settings.assign,
      teams: this.teams.map((team) => ({ ...team, members: sizes.get(team.id) ?? 0 })),
      games: GAME_ORDER.filter((id) => this.settings.games[id] > 0),
      playerCount: this.players.size,
    };
  }
}
