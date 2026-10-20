import { test } from "node:test";
import assert from "node:assert/strict";
import { Room, cleanName, normalizeSettings } from "../server/room.js";
import {
  AVATARS,
  CENTER_ROUNDS,
  COLOR_POINTS,
  POLL_POINTS,
  REACTION_MAX,
  REACTION_ROUNDS,
  WHOIS_AUTHOR_POINTS,
  MEMORY_PAIRS,
  MEMORY_POINTS,
  TAP_MAX_RATE,
  TAP_POINTS,
  answerPoints,
  estimatePoints,
  memoryDeck,
  centerPoints,
  centerTargets,
  colorLevel,
  reactionPoints,
  seededRandom,
} from "../shared/games.js";

/** Phòng với đồng hồ giả để kiểm soát thời gian. */
function makeRoom(settings) {
  let clock = 1_000_000;
  const room = new Room({ pin: "1234", settings, now: () => clock, random: seededRandom("test") });
  return { room, advance: (ms) => (clock += ms), now: () => clock };
}

/** Đi tới bước đầu tiên có kiểu `kind` của trò `game`. */
function goToStep(room, game, kind) {
  for (let guard = 0; guard < 100; guard += 1) {
    if (room.step?.game === game && room.step.kind === kind && ["question", "challenge"].includes(room.phase)) return room.step;
    room.next();
  }
  throw new Error(`Không tới được ${game}/${kind}`);
}

test("chuẩn hoá cài đặt: giá trị lạ về mặc định, số câu bị giới hạn", () => {
  const settings = normalizeSettings({ mode: "x", teamCount: 99, pack: "custom", games: { quiz: 999, poll: -3, color: 5 } });
  assert.equal(settings.mode, "team");
  assert.equal(settings.teamCount, 6);
  assert.equal(settings.games.poll, 0);
  assert.equal(settings.games.color, 1);
  assert.ok(settings.games.quiz > 0 && settings.games.quiz <= 16);
  const empty = normalizeSettings({ pack: "custom", games: {} });
  assert.ok(Object.values(empty.games).some((n) => n > 0), "gói rỗng thì dùng gói nhanh");
});

test("tên được làm sạch và không trùng nhau", () => {
  assert.equal(cleanName("   Minh    Anh  "), "Minh Anh");
  assert.equal(cleanName("a".repeat(40)).length, 20);
  const { room } = makeRoom({ mode: "solo" });
  const first = room.join({ name: "An" }).player;
  const second = room.join({ name: "an" }).player;
  assert.equal(first.name, "An");
  assert.equal(second.name, "an 2");
  assert.ok(room.join({ name: "   " }).error);
  room.dispose();
});

test("tự động chia team đều người", () => {
  const { room } = makeRoom({ mode: "team", teamCount: 3, assign: "auto" });
  for (let i = 0; i < 10; i += 1) room.join({ name: `P${i}` });
  const sizes = [...room.teamSizes().values()].sort();
  assert.deepEqual(sizes, [3, 3, 4]);
  room.shuffleTeams();
  assert.deepEqual([...room.teamSizes().values()].sort(), [3, 3, 4]);
  room.dispose();
});

test("học viên tự chọn team, đổi team chỉ khi còn ở phòng chờ", () => {
  const { room } = makeRoom({ mode: "team", teamCount: 2, assign: "choose" });
  const player = room.join({ name: "Lan", teamId: "vector" }).player;
  assert.equal(player.teamId, "vector");
  assert.ok(room.setTeam(player.id, "pixel").ok);
  assert.equal(player.teamId, "pixel");
  room.start();
  assert.ok(room.setTeam(player.id, "vector").error);
  room.dispose();
});

test("quiz: đáp án được giấu tới lúc công bố, trả lời nhanh được nhiều điểm hơn", () => {
  const { room, advance } = makeRoom({ mode: "team", teamCount: 2, pack: "custom", games: { quiz: 2 } });
  const fast = room.join({ name: "Nhanh" }).player;
  const slow = room.join({ name: "Chậm" }).player;
  const wrong = room.join({ name: "Sai" }).player;
  room.start();
  const step = goToStep(room, "quiz", "question");
  assert.equal(room.playerView(fast.id).step.answer, null, "chưa công bố thì không gửi đáp án");
  assert.equal(room.hostView().step.answer, null);

  assert.ok(room.answer(fast.id, step.id, step.answer).ok);
  assert.ok(room.answer(fast.id, step.id, step.answer).error, "không trả lời hai lần");
  advance(10_000);
  room.answer(slow.id, step.id, step.answer);
  room.answer(wrong.id, step.id, (step.answer + 1) % step.options.length);
  room.next(); // công bố

  assert.equal(room.phase, "reveal");
  assert.equal(room.playerView(fast.id).step.answer, step.answer);
  assert.equal(fast.score, 1000);
  assert.equal(slow.score, answerPoints(true, 10_000, 20_000));
  assert.ok(fast.score > slow.score);
  assert.equal(wrong.score, 0);
  assert.deepEqual(room.playerView(fast.id).step.counts.reduce((a, b) => a + b, 0), 3);
  room.dispose();
});

test("trả lời sau khi hết giờ bị từ chối", () => {
  const { room, advance } = makeRoom({ mode: "solo", pack: "custom", games: { quiz: 1 } });
  const late = room.join({ name: "Muộn" }).player;
  room.start();
  const step = goToStep(room, "quiz", "question");
  advance(25_000);
  assert.ok(room.answer(late.id, step.id, 0).error);
  room.dispose();
});

test("đoán số đông: người chọn giống số đông được điểm", () => {
  const { room } = makeRoom({ mode: "solo", pack: "custom", games: { poll: 1 } });
  const a = room.join({ name: "A" }).player;
  const b = room.join({ name: "B" }).player;
  const c = room.join({ name: "C" }).player;
  room.start();
  const step = goToStep(room, "poll", "question");
  room.answer(a.id, step.id, 0);
  room.answer(b.id, step.id, 0);
  room.answer(c.id, step.id, 1);
  room.next();
  assert.equal(a.score, POLL_POINTS);
  assert.equal(b.score, POLL_POINTS);
  assert.equal(c.score, 0);
  assert.deepEqual(room.hostView().step.majority, [0]);
  room.dispose();
});

test("mắt thần màu sắc: server kiểm tra từng lần chạm theo seed", () => {
  const { room, advance } = makeRoom({ mode: "solo", pack: "custom", games: { color: 1 } });
  const player = room.join({ name: "Mắt" }).player;
  room.start();
  const step = goToStep(room, "color", "challenge");
  assert.ok(room.challengeMove(player.id, step.id, { level: 0, index: 0 }).error, "chưa hết đếm ngược");
  advance(3_100);
  const level0 = colorLevel(step.seed, 0);
  assert.equal(room.challengeMove(player.id, step.id, { level: 0, index: level0.odd }).ok, true);
  const level1 = colorLevel(step.seed, 1);
  const miss = room.challengeMove(player.id, step.id, { level: 1, index: (level1.odd + 1) % (level1.size * level1.size) });
  assert.equal(miss.ok, false);
  assert.equal(room.challengeMove(player.id, step.id, { level: 1, index: level1.odd }).locked, true, "chạm sai bị khoá 1 giây");
  advance(1_100);
  assert.equal(room.challengeMove(player.id, step.id, { level: 1, index: level1.odd }).ok, true);
  assert.equal(player.score, 2 * COLOR_POINTS);
  room.dispose();
});

test("pixel perfect: điểm theo khoảng cách tới tâm, 5 hình là xong", () => {
  const { room, advance } = makeRoom({ mode: "solo", pack: "custom", games: { center: 1 } });
  const player = room.join({ name: "Tâm" }).player;
  room.start();
  const step = goToStep(room, "center", "challenge");
  advance(3_100);
  const targets = centerTargets(step.seed);
  const perfect = room.challengeMove(player.id, step.id, { round: 0, x: targets[0].cx, y: targets[0].cy });
  assert.equal(perfect.points, 300);
  const off = room.challengeMove(player.id, step.id, { round: 1, x: targets[1].cx + 5, y: targets[1].cy });
  assert.equal(off.points, centerPoints(5));
  for (let round = 2; round < CENTER_ROUNDS; round += 1) room.challengeMove(player.id, step.id, { round, x: 0, y: 0 });
  assert.equal(room.challengeMove(player.id, step.id, { round: CENTER_ROUNDS, x: 1, y: 1 }).ok, false);
  room.dispose();
});

test("hình của pixel perfect nằm trọn trong khung", () => {
  for (const seed of ["a", "b", "c", "d", "e", "f"]) {
    for (const t of centerTargets(seed)) {
      assert.ok(t.x >= 0 && t.y >= 0 && t.x + t.w <= 100 && t.y + t.h <= 100, `${seed}: ${JSON.stringify(t)}`);
    }
  }
});

test("điểm team: trung bình hoặc tổng", () => {
  const { room } = makeRoom({ mode: "team", teamCount: 2, assign: "choose", teamScore: "avg" });
  const a1 = room.join({ name: "A1", teamId: "pixel" }).player;
  const a2 = room.join({ name: "A2", teamId: "pixel" }).player;
  const b1 = room.join({ name: "B1", teamId: "vector" }).player;
  a1.score = 1000;
  a2.score = 0;
  b1.score = 800;
  const [first, second] = room.teamRanking();
  assert.equal(first.id, "vector", "trung bình: 800 > 500");
  assert.equal(second.avg, 500);
  room.settings.teamScore = "sum";
  assert.equal(room.teamRanking()[0].id, "pixel", "tổng: 1000 > 800");
  room.dispose();
});

test("cả buổi chơi đi hết tới kết quả cuối, chơi lại thì xoá điểm", () => {
  const { room, advance } = makeRoom({ mode: "team", teamCount: 2, pack: "full" });
  const player = room.join({ name: "Hết" }).player;
  room.start();
  for (let guard = 0; guard < 200 && room.phase !== "final"; guard += 1) {
    if (room.phase === "question") room.answer(player.id, room.step.id, 0);
    if (room.phase === "challenge") advance(3_100);
    room.next();
  }
  assert.equal(room.phase, "final");
  room.restart();
  assert.equal(room.phase, "lobby");
  assert.equal(player.score, 0);
  room.dispose();
});

test("ai là ai: câu hỏi lấy từ điều thú vị, người viết không trả lời và được điểm chia sẻ", () => {
  const { room } = makeRoom({ mode: "solo", pack: "custom", games: { whois: 3 } });
  const an = room.join({ name: "An", fact: "Mình từng nuôi 5 con mèo" }).player;
  const binh = room.join({ name: "Bình", fact: "Mình biết đánh đàn bầu" }).player;
  const chi = room.join({ name: "Chi" }).player;
  room.start();
  const step = goToStep(room, "whois", "question");
  const author = step.authorId === an.id ? an : binh;
  const guessers = [an, binh, chi].filter((p) => p.id !== author.id);
  assert.equal(step.total, 2, "chỉ 2 bạn viết điều thú vị");
  assert.ok(step.options.includes(author.name));
  assert.equal(room.hostView().step.answer, null, "chưa công bố thì không lộ người viết");
  assert.equal(room.playerView(author.id).me.isAuthor, true);
  assert.equal(room.playerView(guessers[0].id).me.isAuthor, false);
  assert.ok(room.answer(author.id, step.id, step.answer).error, "người viết không được trả lời");
  room.answer(guessers[0].id, step.id, step.answer);
  room.answer(guessers[1].id, step.id, (step.answer + 1) % step.options.length);
  assert.equal(room.phase, "question");
  room.next();
  assert.equal(author.score, WHOIS_AUTHOR_POINTS);
  assert.equal(guessers[0].score, 1000);
  assert.equal(guessers[1].score, 0);
  assert.equal(room.playerView(author.id).me.last.author, true);
  room.dispose();
});

test("ai là ai: bỏ qua phần này khi chưa ai viết điều thú vị", () => {
  const { room } = makeRoom({ mode: "solo", pack: "custom", games: { whois: 3, poll: 1 } });
  room.join({ name: "An" });
  room.join({ name: "Bình" });
  room.start();
  assert.ok(room.steps.every((step) => step.game !== "whois"));
  room.dispose();
});

test("đuổi hình bắt chữ và đoán số đông có hình minh hoạ", () => {
  const { room } = makeRoom({ mode: "solo", pack: "custom", games: { rebus: 1, poll: 1 } });
  room.join({ name: "An" });
  room.start();
  const poll = goToStep(room, "poll", "question");
  assert.equal(room.hostView().step.optionArt.length, 2);
  assert.equal(poll.options.length, 2);
  room.next();
  const rebus = goToStep(room, "rebus", "question");
  const view = room.hostView().step;
  assert.equal(view.visual.type, "emoji");
  assert.equal(view.options.length, 4);
  assert.equal(view.answer, null);
  assert.ok(Number.isInteger(rebus.answer));
  room.dispose();
});

test("phản xạ nhanh: chạm sớm hoặc đoán mò được 0, nhanh được nhiều điểm, 5 lượt là xong", () => {
  assert.equal(reactionPoints(200), REACTION_MAX);
  assert.equal(reactionPoints(1000), 0);
  assert.equal(reactionPoints(50), 0);
  assert.ok(reactionPoints(400) > reactionPoints(600));
  const { room, advance } = makeRoom({ mode: "solo", pack: "custom", games: { reaction: 1 } });
  const player = room.join({ name: "Nhanh" }).player;
  room.start();
  const step = goToStep(room, "reaction", "challenge");
  advance(3_100);
  assert.equal(room.challengeMove(player.id, step.id, { round: 0, early: true }).points, 0);
  assert.equal(room.challengeMove(player.id, step.id, { round: 1, ms: 240 }).points, REACTION_MAX);
  assert.equal(room.challengeMove(player.id, step.id, { round: 1, ms: 240 }).ok, false, "không chơi lại lượt cũ");
  for (let round = 2; round < REACTION_ROUNDS; round += 1) room.challengeMove(player.id, step.id, { round, ms: 400 });
  assert.equal(player.score, REACTION_MAX + 3 * reactionPoints(400));
  assert.equal(room.publicChallengeState(room.current.challenge.get(player.id)).best, 240);
  room.dispose();
});

test("hồ sơ: avatar hợp lệ, điều thú vị chỉ đổi được trước khi bắt đầu", () => {
  const { room } = makeRoom({ mode: "solo", pack: "custom", games: { poll: 1 } });
  const player = room.join({ name: "An", avatar: "🦄" }).player;
  assert.equal(player.avatar, "🦄");
  assert.ok(AVATARS.includes(room.join({ name: "Bình", avatar: "💣" }).player.avatar), "avatar lạ được thay bằng avatar có sẵn");
  assert.ok(room.setProfile(player.id, { fact: "  Mình   thích   mèo  " }).ok);
  assert.equal(player.fact, "Mình thích mèo");
  assert.ok(room.setProfile(player.id, { avatar: "💣" }).error);
  room.start();
  assert.ok(room.setProfile(player.id, { fact: "đổi" }).error);
  room.dispose();
});

test("thật hay đùa: hai lựa chọn có hình, chấm điểm như câu hỏi thường", () => {
  const { room } = makeRoom({ mode: "solo", pack: "custom", games: { truth: 1 } });
  const player = room.join({ name: "An" }).player;
  room.start();
  const step = goToStep(room, "truth", "question");
  assert.deepEqual(step.options, ["Thật", "Đùa"]);
  assert.equal(room.hostView().step.optionArt.length, 2);
  assert.equal(room.hostView().step.answer, null);
  room.answer(player.id, step.id, step.answer);
  room.next();
  assert.equal(player.score, 1000);
  room.dispose();
});

test("đoán gần đúng: nhận con số trong khoảng, càng sát càng nhiều điểm", () => {
  assert.equal(estimatePoints(50, 50, 0, 100), 1000);
  assert.equal(estimatePoints(75, 50, 0, 100), 500);
  assert.equal(estimatePoints(100, 50, 0, 100), 0);
  const { room } = makeRoom({ mode: "solo", pack: "custom", games: { estimate: 1 } });
  const near = room.join({ name: "Sát" }).player;
  const far = room.join({ name: "Xa" }).player;
  const out = room.join({ name: "Lố" }).player;
  room.start();
  const step = goToStep(room, "estimate", "question");
  assert.equal(room.hostView().step.answer, null, "chưa công bố thì không lộ đáp án");
  assert.ok(room.answer(out.id, step.id, step.range.max + 1).error, "ngoài khoảng bị từ chối");
  room.answer(near.id, step.id, step.answer);
  room.answer(far.id, step.id, step.range.min);
  room.next();
  const view = room.hostView().step;
  assert.equal(view.estimate.answer, step.answer);
  assert.equal(view.estimate.closest[0].id, near.id);
  assert.equal(near.score, 1000);
  assert.ok(far.score < near.score);
  assert.equal(view.counts, null);
  room.dispose();
});

test("lật hình ghép đôi: chỉ cặp đúng được điểm, xong hết được thưởng thời gian", () => {
  const { room, advance } = makeRoom({ mode: "solo", pack: "custom", games: { memory: 1 } });
  const player = room.join({ name: "Nhớ" }).player;
  room.start();
  const step = goToStep(room, "memory", "challenge");
  advance(3_100);
  const deck = memoryDeck(step.seed);
  const wrongB = deck.findIndex((emoji) => emoji !== deck[0]);
  assert.equal(room.challengeMove(player.id, step.id, { a: 0, b: wrongB }).ok, false);
  const pairs = new Map();
  deck.forEach((emoji, index) => pairs.set(emoji, [...(pairs.get(emoji) ?? []), index]));
  const list = [...pairs.values()];
  assert.equal(list.length, MEMORY_PAIRS);
  assert.equal(room.challengeMove(player.id, step.id, { a: list[0][0], b: list[0][1] }).ok, true);
  assert.equal(room.challengeMove(player.id, step.id, { a: list[0][0], b: list[0][1] }).ok, false, "không ghép lại cặp cũ");
  advance(10_000);
  let last;
  for (const [a, b] of list.slice(1)) last = room.challengeMove(player.id, step.id, { a, b });
  assert.ok(last.bonus > 0);
  assert.equal(player.score, MEMORY_PAIRS * MEMORY_POINTS + last.bonus);
  room.dispose();
});

test("đua bấm: chặn tốc độ bất thường, mỗi lần bấm 10 điểm", () => {
  const { room, advance } = makeRoom({ mode: "team", teamCount: 2, pack: "custom", games: { tap: 1 } });
  const player = room.join({ name: "Bấm" }).player;
  room.start();
  const step = goToStep(room, "tap", "challenge");
  advance(3_000 + 2_000);
  const first = room.challengeMove(player.id, step.id, { taps: 1000 });
  assert.equal(first.accepted, 2 * TAP_MAX_RATE, "trong 2 giây chỉ tính tối đa 30 lần");
  advance(1_000);
  assert.equal(room.challengeMove(player.id, step.id, { taps: 5 }).accepted, 5);
  assert.equal(player.score, (2 * TAP_MAX_RATE + 5) * TAP_POINTS);
  assert.ok(room.challengeMove(player.id, step.id, { taps: -3 }).error);
  room.dispose();
});

test("các gói chơi đều chạy hết tới kết quả cuối", () => {
  for (const pack of ["quick", "full", "active", "uiux"]) {
    const { room, advance } = makeRoom({ mode: "team", teamCount: 2, pack });
    const a = room.join({ name: "A", fact: "Mình thích mèo" }).player;
    room.join({ name: "B", fact: "Mình thích chó" });
    room.start();
    for (let guard = 0; guard < 300 && room.phase !== "final"; guard += 1) {
      if (room.phase === "question") room.answer(a.id, room.step.id, room.step.range ? room.step.range.min : 0);
      if (room.phase === "challenge") advance(3_100);
      room.next();
    }
    assert.equal(room.phase, "final", pack);
    room.dispose();
  }
});
