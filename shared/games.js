// Luật chơi dùng chung cho server và trình duyệt: thông tin trò chơi, gói chơi, cách tính điểm
// và bộ sinh màn chơi theo seed (server và máy học viên tạo ra cùng một màn chơi).

/**
 * @typedef {"poll" | "whois" | "rebus" | "quiz" | "ab" | "reaction" | "color" | "center"} GameId
 * set: "warmup" là trò làm quen không cần chuyên môn, "uiux" là trò chuyên môn cho các buổi sau.
 * theme: màu của Badge/DockIcon · card: màu thẻ Subtle · hero: màu thẻ Solid (màn giới thiệu) · art: emoji trang trí.
 * @typedef {{ id: GameId, set: "warmup" | "uiux", kind: "question" | "challenge", title: string, emoji: string, art: string[], theme: string, card: string, hero: string, short: string, howTo: string[], seconds: number, estimate: number }} GameMeta
 */

/** @type {Record<GameId, GameMeta>} */
export const GAMES = {
  poll: {
    id: "poll",
    set: "warmup",
    kind: "question",
    title: "Đoán số đông",
    emoji: "🤝",
    art: ["🏖️", "☕", "🐶", "🍜"],
    theme: "pink",
    card: "purple",
    hero: "brand",
    short: "Biển hay núi? Cà phê hay trà sữa? Chọn giống số đông thì được điểm.",
    howTo: ["Chọn 1 trong 2 điều bạn thích hơn.", "Bạn chọn giống số đông thì được 500 điểm.", "Xem cả lớp nghiêng về bên nào!"],
    seconds: 12,
    estimate: 25,
  },
  whois: {
    id: "whois",
    set: "warmup",
    kind: "question",
    title: "Ai là ai?",
    emoji: "🕵️",
    art: ["🤫", "💬", "❓", "👀"],
    theme: "violet",
    card: "violet",
    hero: "cyan",
    short: "Đoán xem bạn nào đã viết điều thú vị trên màn hình.",
    howTo: ["Mỗi bạn viết một điều thú vị về mình khi vào phòng.", "Đoán xem ai đã viết điều đó. Đúng và nhanh được 500 đến 1.000 điểm.", "Người viết được 300 điểm vì đã chia sẻ."],
    seconds: 15,
    estimate: 30,
  },
  rebus: {
    id: "rebus",
    set: "warmup",
    kind: "question",
    title: "Đuổi hình bắt chữ",
    emoji: "🧩",
    art: ["🐸", "🎸", "🦁", "🍜"],
    theme: "orange",
    card: "orange",
    hero: "yellow",
    short: "Nhìn emoji, đoán thành ngữ, tên phim hoặc món ăn.",
    howTo: ["Nhìn hình emoji trên màn hình.", "Chọn thành ngữ, tên phim hoặc món ăn đúng.", "Đúng và nhanh được 500 đến 1.000 điểm."],
    seconds: 20,
    estimate: 32,
  },
  quiz: {
    id: "quiz",
    set: "uiux",
    kind: "question",
    title: "Quiz nhanh UI/UX",
    emoji: "🧠",
    art: ["💡", "📐", "🎯", "✏️"],
    theme: "yellow",
    card: "yellow",
    hero: "orange",
    short: "Trắc nghiệm kiến thức nền UI/UX. Đúng và nhanh thì nhiều điểm.",
    howTo: ["Đọc câu hỏi trên màn hình lớn hoặc trên điện thoại.", "Trả lời đúng được 500 đến 1.000 điểm.", "Càng nhanh càng nhiều điểm."],
    seconds: 20,
    estimate: 35,
  },
  ab: {
    id: "ab",
    set: "uiux",
    kind: "question",
    title: "A hay B?",
    emoji: "🆚",
    art: ["🅰️", "🅱️", "👀", "✨"],
    theme: "blue",
    card: "blue",
    hero: "cyan",
    short: "Hai thiết kế, chọn cái tốt hơn rồi xem nguyên tắc đằng sau.",
    howTo: ["Xem hai phương án thiết kế A và B.", "Chọn phương án tốt hơn.", "Đúng và nhanh được 500 đến 1.000 điểm."],
    seconds: 20,
    estimate: 40,
  },
  reaction: {
    id: "reaction",
    set: "warmup",
    kind: "challenge",
    title: "Phản xạ nhanh",
    emoji: "🚦",
    art: ["⚡", "🟢", "🔴", "👆"],
    theme: "green",
    card: "green",
    hero: "neutral",
    short: "Chờ đèn chuyển xanh rồi chạm thật nhanh. Ai phản xạ nhanh nhất?",
    howTo: ["Màn hình đỏ: chờ, đừng chạm.", "Màn hình chuyển xanh: chạm thật nhanh!", "Có 5 lượt, mỗi lượt tối đa 200 điểm. Chạm sớm được 0 điểm."],
    seconds: 40,
    estimate: 55,
  },
  color: {
    id: "color",
    set: "warmup",
    kind: "challenge",
    title: "Mắt thần màu sắc",
    emoji: "🎨",
    art: ["👁️", "🟪", "🟦", "🟩"],
    theme: "violet",
    card: "violet",
    hero: "yellow",
    short: "Tìm ô khác màu trong lưới. Càng lên cao càng khó.",
    howTo: ["Chạm vào ô có màu khác với các ô còn lại.", "Mỗi ô đúng được 50 điểm, lưới sẽ to dần và màu sát nhau hơn.", "Chạm sai sẽ bị khoá 1 giây."],
    seconds: 40,
    estimate: 60,
  },
  center: {
    id: "center",
    set: "uiux",
    kind: "challenge",
    title: "Pixel Perfect",
    emoji: "🎯",
    art: ["📏", "⭕", "🟦", "✨"],
    theme: "green",
    card: "green",
    hero: "neutral",
    short: "Chạm đúng tâm của từng hình. Càng chính xác càng nhiều điểm.",
    howTo: ["Mỗi lượt hiện một hình, chạm vào đúng tâm của nó.", "Chạm càng sát tâm càng nhiều điểm, tối đa 300 điểm mỗi hình.", "Có 5 hình. Hình vòng tròn rỗng thì tâm nằm ở khoảng trống!"],
    seconds: 45,
    estimate: 65,
  },
};

/** Thứ tự các phần trong một buổi chơi: làm quen trước, thử thách sau. */
/** @type {GameId[]} */
export const GAME_ORDER = ["poll", "whois", "rebus", "quiz", "ab", "reaction", "color", "center"];

/** @typedef {Record<GameId, number>} GameCounts */

const none = { poll: 0, whois: 0, rebus: 0, quiz: 0, ab: 0, reaction: 0, color: 0, center: 0 };

/** Gói chơi gợi ý. Số là số câu (trò hỏi đáp) hoặc 0/1 (thử thách). */
/** @type {Record<"quick" | "full" | "uiux", { title: string, set: "warmup" | "uiux", games: GameCounts }>} */
export const PACKS = {
  quick: { title: "Làm quen nhanh", set: "warmup", games: { ...none, poll: 2, whois: 3, rebus: 3, reaction: 1 } },
  full: { title: "Làm quen trọn bộ", set: "warmup", games: { ...none, poll: 3, whois: 4, rebus: 4, reaction: 1, color: 1 } },
  uiux: { title: "Chuyên môn UI/UX", set: "uiux", games: { ...none, quiz: 5, ab: 3, color: 1, center: 1 } },
};

/** Thời gian giới thiệu mỗi phần (giây), dùng để ước tính thời lượng. */
const INTRO_SECONDS = 12;

/** Ước tính thời lượng (giây) của một buổi chơi. */
export function estimateSeconds(/** @type {GameCounts} */ games) {
  let total = 0;
  for (const id of GAME_ORDER) {
    const count = games[id] ?? 0;
    if (count > 0) total += INTRO_SECONDS + count * GAMES[id].estimate;
  }
  return total;
}

/** Đội chơi. */
export const TEAM_PRESETS = [
  { id: "pixel", name: "Pixel", emoji: "👾", icon: "icon-cube-solid", theme: "violet", card: "violet" },
  { id: "vector", name: "Vector", emoji: "✒️", icon: "icon-pen-tool-01-solid", theme: "blue", card: "blue" },
  { id: "layer", name: "Layer", emoji: "🧱", icon: "icon-layers-three-01-solid", theme: "orange", card: "orange" },
  { id: "grid", name: "Grid", emoji: "🧩", icon: "icon-grid-01-solid", theme: "green", card: "green" },
  { id: "gradient", name: "Gradient", emoji: "🌈", icon: "icon-brush-01-solid", theme: "pink", card: "purple" },
  { id: "kerning", name: "Kerning", emoji: "🔠", icon: "icon-type-square-solid", theme: "teal", card: "cyan" },
];

/** Ảnh đại diện học viên chọn khi vào phòng. */
export const AVATARS = ["🐶", "🐱", "🦊", "🐼", "🐨", "🐯", "🦁", "🐸", "🐵", "🐰", "🐻", "🐷", "🐮", "🐔", "🐧", "🦄"];

export const MIN_TEAMS = 2;
export const MAX_TEAMS = TEAM_PRESETS.length;
export const NAME_MAX = 20;
export const FACT_MAX = 90;

/* ── Điểm ─────────────────────────────────────────────── */

export const POLL_POINTS = 500;
export const WHOIS_AUTHOR_POINTS = 300;
export const COLOR_POINTS = 50;
export const CENTER_MAX = 300;
export const CENTER_ROUNDS = 5;
/** Khoảng cách (theo % cạnh khung chơi) mà từ đó trở ra thì 0 điểm. */
export const CENTER_ZERO_AT = 10;
export const COLOR_MISS_LOCK_MS = 1000;
export const REACTION_ROUNDS = 5;
export const REACTION_MAX = 200;
/** Nhanh hơn mức này là đoán mò (chạm trước khi kịp thấy), không tính điểm. */
export const REACTION_MIN_MS = 100;
/** Thời gian đếm ngược 3‑2‑1 trước mỗi thử thách. */
export const CHALLENGE_LEAD_MS = 3000;

/** Điểm cho câu hỏi có đáp án đúng: đúng được 500, cộng thêm tới 500 theo thời gian còn lại. Làm tròn tới 10. */
export function answerPoints(/** @type {boolean} */ correct, /** @type {number} */ msLeft, /** @type {number} */ limitMs) {
  if (!correct) return 0;
  const share = Math.min(1, Math.max(0, msLeft / limitMs));
  return 500 + Math.round((500 * share) / 10) * 10;
}

/** Điểm Pixel Perfect theo khoảng cách tới tâm (đơn vị: % cạnh khung). */
export function centerPoints(/** @type {number} */ distance) {
  return Math.round(CENTER_MAX * Math.max(0, 1 - distance / CENTER_ZERO_AT));
}

/** Điểm Phản xạ nhanh: 250 ms trở xuống được tối đa, 1 giây trở lên được 0. */
export function reactionPoints(/** @type {number} */ ms) {
  if (!Number.isFinite(ms) || ms < REACTION_MIN_MS) return 0;
  const share = 1 - (ms - 250) / 750;
  return Math.round(REACTION_MAX * Math.min(1, Math.max(0, share)));
}

/* ── Sinh màn chơi theo seed ─────────────────────────── */

/** Băm chuỗi thành số 32 bit (FNV-1a). */
export function hashString(/** @type {string} */ text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Bộ số ngẫu nhiên có seed (mulberry32): cùng seed cho cùng dãy số. */
export function seededRandom(/** @type {string | number} */ seed) {
  let state = typeof seed === "number" ? seed >>> 0 : hashString(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Thời gian chờ (ms) trước khi đèn chuyển xanh ở từng lượt Phản xạ nhanh. */
export function reactionDelays(/** @type {string} */ seed) {
  const random = seededRandom(`${seed}:reaction`);
  return Array.from({ length: REACTION_ROUNDS }, () => Math.round(1300 + random() * 2400));
}

/**
 * Màn thứ `level` của Mắt thần màu sắc. Tất cả học viên gặp cùng một dãy màn trong một lượt chơi.
 * @returns {{ size: number, odd: number, base: string, oddColor: string }}
 */
export function colorLevel(/** @type {string} */ seed, /** @type {number} */ level) {
  const random = seededRandom(`${seed}:color:${level}`);
  const size = level < 2 ? 2 : level < 5 ? 3 : level < 9 ? 4 : level < 14 ? 5 : level < 20 ? 6 : 7;
  const hue = Math.floor(random() * 360);
  const saturation = 45 + Math.floor(random() * 35);
  const lightness = 42 + Math.floor(random() * 20);
  const delta = Math.max(4, 24 - level * 1.2);
  const direction = random() < 0.5 ? -1 : 1;
  const odd = Math.floor(random() * size * size);
  const oddLightness = Math.round(Math.min(90, Math.max(12, lightness + direction * delta)));
  return {
    size,
    odd,
    base: `hsl(${hue} ${saturation}% ${lightness}%)`,
    oddColor: `hsl(${hue} ${saturation}% ${oddLightness}%)`,
  };
}

/** Màu tô cho hình của Pixel Perfect (tên token Zen của Shape). */
export const CENTER_FILLS = [
  "support-violet-solid",
  "support-blue-solid",
  "support-orange-solid",
  "support-green-solid",
  "support-pink-solid",
  "support-teal-solid",
];

/**
 * Các hình của Pixel Perfect. Toạ độ theo % cạnh khung vuông: x, y là góc trên trái, w, h là kích thước.
 * @returns {Array<{ type: "rectangle" | "rounded" | "ellipse" | "ring", x: number, y: number, w: number, h: number, cx: number, cy: number, fill: string }>}
 */
export function centerTargets(/** @type {string} */ seed) {
  const random = seededRandom(`${seed}:center`);
  /** @type {Array<"rectangle" | "rounded" | "ellipse" | "ring">} */
  const types = ["rectangle", "ellipse", "rounded", "ring", "ellipse"];
  return types.map((type, index) => {
    const base = 26 + random() * 30;
    const aspect = type === "ring" ? 1 : 0.55 + random() * 0.9;
    const w = Math.round(type === "ring" ? base + 8 : base);
    const h = Math.round(Math.min(70, Math.max(18, w * aspect)));
    const x = Math.round(4 + random() * (92 - w));
    const y = Math.round(4 + random() * (92 - h));
    return { type, x, y, w, h, cx: x + w / 2, cy: y + h / 2, fill: CENTER_FILLS[index % CENTER_FILLS.length] };
  });
}

/** Xáo trộn mảng (bản sao) bằng hàm random cho trước. */
export function shuffle(/** @type {any[]} */ items, random = Math.random) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
