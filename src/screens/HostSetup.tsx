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
import { GAMES, GAME_ORDER, MAX_TEAMS, MIN_TEAMS, PACKS, estimateSeconds, type GameCounts, type GameId } from "../../shared/games.js";
import { AB, POLLS, QUIZ } from "../../shared/content.js";
import { minutesLabel } from "../lib/format";
import { navigate } from "../lib/router";
import { request } from "../lib/socket";
import { hostKeyFor, save } from "../lib/storage";

type Pack = "quick" | "full" | "custom";

const LIMITS: GameCounts = { poll: POLLS.length, quiz: QUIZ.length, ab: AB.length, color: 1, center: 1 };

const packSummary = (games: GameCounts) =>
  GAME_ORDER.filter((id) => games[id] > 0)
    .map((id) => (GAMES[id].kind === "challenge" ? `${GAMES[id].emoji} ${GAMES[id].title}` : `${GAMES[id].emoji} ${GAMES[id].title} (${games[id]} câu)`))
    .join(" · ");

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

  const packCards: Array<{ id: Pack; title: string; time: string; caption: string; color: CardColor }> = [
    { id: "quick", title: `⚡ ${PACKS.quick.title}`, time: minutesLabel(estimateSeconds(PACKS.quick.games)), caption: packSummary(PACKS.quick.games), color: "yellow" },
    { id: "full", title: `🎉 ${PACKS.full.title}`, time: minutesLabel(estimateSeconds(PACKS.full.games)), caption: packSummary(PACKS.full.games), color: "violet" },
    { id: "custom", title: "🛠️ Tự chọn", time: minutesLabel(estimateSeconds(custom)), caption: "Chọn từng trò chơi và số câu hỏi.", color: "cyan" },
  ];

  return (
    <Container maxWidth="md">
      <Stack gap="xl" paddingY="lg">
        <PageHeader
          title="Tạo phòng chơi"
          description="Chọn cách chơi và các trò chơi. Học viên quét mã QR trên màn hình chiếu để vào phòng."
          back={{ label: "Trang chủ", onClick: () => navigate("/") }}
        />

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
                    options={Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => ({ id: String(MIN_TEAMS + i), label: `${MIN_TEAMS + i} team` }))}
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
          <Grid columns={{ mobile: 1, tablet: 3, desktop: 3 }} gap="md">
            {packCards.map((card) => (
              <Card key={card.id} theme="subtle" color={card.color} spacing="sm" selected={pack === card.id} onClick={() => setPack(card.id)} aria-label={`${card.title}, ${card.time}`}>
                <Stack gap="xs">
                  <Stack direction="row" gap="xs" align="center" justify="between" wrap>
                    <Heading level={3} textStyle="Heading/Subheading">
                      {card.title}
                    </Heading>
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
              <Grid columns={{ mobile: 1, desktop: 2 }} gap="lg">
                {GAME_ORDER.map((id) => (
                  <SelectField
                    key={id}
                    label={`${GAMES[id].emoji} ${GAMES[id].title}`}
                    helpText={GAMES[id].short}
                    options={countOptions(id)}
                    value={String(custom[id])}
                    onValueChange={(value) => setCustom((current) => ({ ...current, [id]: Number(value) }))}
                  />
                ))}
              </Grid>
            </Box>
          )}
        </Stack>

        {error && (
          <InlineMessage theme="negative" title="Chưa tạo được phòng">
            {error}
          </InlineMessage>
        )}

        <ActionBar
          direction="horizontal"
          summary={rounds > 0 ? `${minutesLabel(estimateSeconds(games))} · ${sections} phần · ${rounds} lượt chơi` : "Chọn ít nhất một trò chơi"}
          primaryAction={{ label: busy ? "Đang tạo phòng…" : "Tạo phòng", onClick: () => void create(), disabled: busy || rounds === 0 }}
        />
      </Stack>
    </Container>
  );
}
