import { useState } from "react";
import {
  ActionBar,
  Badge,
  Box,
  Card,
  Container,
  FormFieldset,
  Grid,
  Heading,
  InlineMessage,
  PageHeader,
  RadioButton,
  Segmented,
  SelectField,
  Stack,
  Text,
  type CardColor,
} from "@zen-ds/react";
import { GAMES, GAME_ORDER, MAX_TEAMS, MIN_TEAMS, PACKS, estimateSeconds, type GameCounts, type GameId, type PackId } from "../../shared/games.js";
import { AB, ESTIMATES, POLLS, QUIZ, REBUS, TRUTHS } from "../../shared/content.js";
import { EmojiArt } from "../components/Fun";
import { summaryText } from "../components/common";
import { minutesLabel } from "../lib/format";
import { navigate } from "../lib/router";
import { request } from "../lib/socket";
import { hostKeyFor, save } from "../lib/storage";

type Pack = PackId | "custom";

const LIMITS: GameCounts = {
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

const SET_TITLES = { warmup: "Trò làm quen (không chuyên môn)", uiux: "Trò chuyên môn UI/UX" } as const;

const packSummary = (games: GameCounts) =>
  GAME_ORDER.filter((id) => games[id] > 0)
    .map((id) => (GAMES[id].kind === "challenge" ? GAMES[id].title : `${GAMES[id].title} (${games[id]} câu)`))
    .join(" · ");

const packArt = (games: GameCounts) =>
  GAME_ORDER.filter((id) => games[id] > 0)
    .map((id) => GAMES[id].emoji)
    .join(" ");

const countOptions = (id: GameId) => {
  if (GAMES[id].kind === "challenge") return [{ label: "Không chơi", value: "0" }, { label: `Có, ${GAMES[id].seconds} giây`, value: "1" }];
  return Array.from({ length: LIMITS[id] + 1 }, (_, n) => ({ label: n === 0 ? "Không chơi" : `${n} câu`, value: String(n) }));
};

/** Giảng viên chọn cách chơi và gói trò chơi rồi tạo phòng. */
export function HostSetup() {
  const [mode, setMode] = useState<"team" | "solo">("team");
  const [teamCount, setTeamCount] = useState("4");
  const [assign, setAssign] = useState<"auto" | "choose">("auto");
  const [teamScore, setTeamScore] = useState<"avg" | "sum">("avg");
  const [pack, setPack] = useState<Pack>("quick");
  const [custom, setCustom] = useState<GameCounts>({ ...PACKS.full.games });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const games = pack === "custom" ? custom : PACKS[pack].games;
  const rounds = GAME_ORDER.reduce((sum, id) => sum + games[id], 0);
  const sections = GAME_ORDER.filter((id) => games[id] > 0).length;

  const create = async () => {
    setBusy(true);
    setError(null);
    const result = await request<{ ok?: boolean; error?: string; pin?: string; hostKey?: string }>("host:create", {
      settings: { mode, teamCount: Number(teamCount), assign, teamScore, pack, games },
    });
    setBusy(false);
    if (!result.ok || !result.pin || !result.hostKey) {
      setError(result.error ?? "Không tạo được phòng, thử lại nhé.");
      return;
    }
    save(hostKeyFor(result.pin), result.hostKey);
    navigate(`/host/${result.pin}`);
  };

  // Màu thẻ gói theo bảng phối màu: các gói cạnh nhau không trùng màu, "Tự chọn" là màu trung tính.
  const packCards: Array<{ id: Pack; title: string; tag: string; time: string; caption: string; color: CardColor; art: string }> = [
    { id: "quick", title: PACKS.quick.title, tag: "Buổi đầu", time: minutesLabel(estimateSeconds(PACKS.quick.games)), caption: packSummary(PACKS.quick.games), color: "yellow", art: packArt(PACKS.quick.games) },
    { id: "full", title: PACKS.full.title, tag: "Buổi đầu", time: minutesLabel(estimateSeconds(PACKS.full.games)), caption: packSummary(PACKS.full.games), color: "brand", art: packArt(PACKS.full.games) },
    { id: "active", title: PACKS.active.title, tag: "Vận động", time: minutesLabel(estimateSeconds(PACKS.active.games)), caption: packSummary(PACKS.active.games), color: "cyan", art: packArt(PACKS.active.games) },
    { id: "uiux", title: PACKS.uiux.title, tag: "Các buổi sau", time: minutesLabel(estimateSeconds(PACKS.uiux.games)), caption: packSummary(PACKS.uiux.games), color: "violet", art: packArt(PACKS.uiux.games) },
    { id: "custom", title: "Tự chọn", tag: "Tuỳ ý", time: minutesLabel(estimateSeconds(custom)), caption: "Chọn từng trò chơi và số câu hỏi.", color: "neutral", art: "🛠️" },
  ];

  return (
    <Container maxWidth="xl" className="page">
      {/* Cao ít nhất bằng cửa sổ: nội dung ngắn (màn lớn) thì thanh hành động vẫn nằm sát đáy, không lơ lửng giữa trang. */}
      <div className="page-fill">
        <Stack gap="xl" paddingY="lg">
          <PageHeader
            title="Tạo phòng chơi"
            description="Chọn cách chơi và các trò chơi. Học viên quét mã QR trên màn hình chiếu để vào phòng."
            back={{ label: "Trang chủ", onClick: () => navigate("/") }}
          />

          {/* Desktop: cách chơi bên trái, chọn trò chơi bên phải. Điện thoại: xếp dọc theo cùng thứ tự. */}
          <Grid columns={{ mobile: 1, tablet: 1, desktop: "minmax(0, 5fr) minmax(0, 7fr)" }} gap="xl" align="start">
            <Box surface="surface" radius="2xl" padding="xl">
              <Stack gap="lg">
                <Heading level={2} textStyle="Heading/4">
                  Cách chơi
                </Heading>
                <Segmented
                  aria-label="Cách chơi"
                  value={mode}
                  onValueChange={(value) => setMode(value as "team" | "solo")}
                  options={[
                    { id: "team", label: "Theo team" },
                    { id: "solo", label: "Cá nhân" },
                  ]}
                />
                {mode === "team" ? (
                  <>
                    <FormFieldset legend="Số team">
                      <Segmented
                        aria-label="Số team"
                        value={teamCount}
                        onValueChange={setTeamCount}
                        options={Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => ({ id: String(MIN_TEAMS + i), label: String(MIN_TEAMS + i) }))}
                      />
                    </FormFieldset>
                    <FormFieldset legend="Chia team" kind="radio">
                      <RadioButton name="assign" value="auto" checked={assign === "auto"} onCheckedChange={() => setAssign("auto")} label="Tự động chia đều" caption="Mỗi học viên mới vào được xếp vào team đang ít người nhất. Có thể xáo lại trước khi bắt đầu." />
                      <RadioButton name="assign" value="choose" checked={assign === "choose"} onCheckedChange={() => setAssign("choose")} label="Học viên tự chọn team" caption="Hợp khi lớp đã ngồi theo nhóm." />
                    </FormFieldset>
                    <FormFieldset legend="Điểm của team" kind="radio">
                      <RadioButton name="teamScore" value="avg" checked={teamScore === "avg"} onCheckedChange={() => setTeamScore("avg")} label="Trung bình mỗi thành viên" caption="Công bằng khi các team chênh nhau số người." />
                      <RadioButton name="teamScore" value="sum" checked={teamScore === "sum"} onCheckedChange={() => setTeamScore("sum")} label="Tổng điểm cả team" />
                    </FormFieldset>
                  </>
                ) : (
                  <Text tone="base">Mỗi học viên chơi riêng, chỉ có bảng xếp hạng cá nhân.</Text>
                )}
              </Stack>
            </Box>

            <Stack gap="md">
              <Heading level={2} textStyle="Heading/4">
                Trò chơi
              </Heading>
              <Grid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="md">
                {packCards.map((card) => (
                  <Card key={card.id} theme="subtle" color={card.color} spacing="sm" selected={pack === card.id} onClick={() => setPack(card.id)} aria-label={`${card.title}, ${card.time}`}>
                    <Stack gap="xs">
                      <EmojiArt size="sm">{card.art}</EmojiArt>
                      <Heading level={3} textStyle="Heading/Subheading">
                        {card.title}
                      </Heading>
                      <Stack direction="row" gap="2xs" wrap>
                        <Badge theme="neutral" background="subtle" size="sm" leadingIcon={false}>
                          {card.tag}
                        </Badge>
                        <Badge theme="neutral" background="subtle" size="sm" leadingIcon={false}>
                          {card.time}
                        </Badge>
                      </Stack>
                      <Text textStyle="Body/Small/Regular" tone="base">
                        {card.caption}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </Grid>

              {pack === "custom" && (
                <Box surface="surface" radius="2xl" padding="xl">
                  <Stack gap="xl">
                    {(["warmup", "uiux"] as const).map((set) => (
                      <Stack key={set} gap="md">
                        <Heading level={3} textStyle="Heading/Subheading">
                          {SET_TITLES[set]}
                        </Heading>
                        <Grid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="lg">
                          {GAME_ORDER.filter((id) => GAMES[id].set === set).map((id) => (
                            <SelectField
                              key={id}
                              label={GAMES[id].title}
                              helpText={GAMES[id].short}
                              options={countOptions(id)}
                              value={String(custom[id])}
                              onValueChange={(value) => setCustom((current) => ({ ...current, [id]: Number(value) }))}
                            />
                          ))}
                        </Grid>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Grid>

          {games.whois > 0 && (
            <InlineMessage theme="info" title="Về trò “Ai là ai?”">
              Khi vào phòng, mỗi học viên viết một điều thú vị về mình. Trò này dùng các câu đó, nên hãy nhắc cả lớp viết trước khi bấm Bắt đầu.
            </InlineMessage>
          )}

          {error && (
            <InlineMessage theme="negative" title="Chưa tạo được phòng">
              {error}
            </InlineMessage>
          )}
        </Stack>
        <ActionBar
          className="bleed-bar"
          direction="horizontal"
          summary={summaryText(rounds > 0 ? `${minutesLabel(estimateSeconds(games))} · ${sections} phần · ${rounds} lượt chơi` : "Chọn ít nhất một trò chơi")}
          primaryAction={{ label: busy ? "Đang tạo phòng…" : "Tạo phòng", onClick: () => void create(), disabled: busy || rounds === 0 }}
        />
      </div>
    </Container>
  );
}
