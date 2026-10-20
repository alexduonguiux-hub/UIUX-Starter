import { useEffect, useMemo, useState } from "react";
import {
  ActionBar,
  AlertBanner,
  Badge,
  BadgeCounter,
  BarList,
  Box,
  Button,
  Card,
  ChartCard,
  Container,
  DockIcon,
  EmptyState,
  Grid,
  Heading,
  IconButton,
  InlineMessage,
  List,
  ListItem,
  Menu,
  Shape,
  SidePanel,
  Stack,
  Stepper,
  Text,
  useToast,
} from "@zen-ds/react";
import { CENTER_ROUNDS, GAMES, REACTION_ROUNDS } from "../../shared/games.js";
import { Answers } from "../components/Answers";
import { GameBadge, GameMark, PlayerAvatar, QuestionVisual, TeamBadge, TeamMark, Timer, medal, summaryText } from "../components/common";
import { Confetti, HeroArt } from "../components/Fun";
import { JoinQr, useJoinBase } from "../components/JoinQr";
import { PlayerStandings, TeamStandings } from "../components/Standings";
import { syncClock, useServerNow } from "../lib/clock";
import { formatPoints, points } from "../lib/format";
import { navigate } from "../lib/router";
import { request, socket, useConnection, useOnConnect } from "../lib/socket";
import { hostKeyFor, load } from "../lib/storage";
import type { HostPlayer, HostView } from "../lib/types";

type Act = (action: "next" | "skip" | "shuffle" | "restart" | "finish" | "kick", extra?: Record<string, unknown>) => void;

/** Màn hình giảng viên, chiếu lên máy chiếu. */
export function HostRoom({ pin }: { pin: string }) {
  const [view, setView] = useState<HostView | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const connection = useConnection();
  const { toast } = useToast();
  const hostKey = load<string>(hostKeyFor(pin));

  useEffect(() => {
    const onState = (next: HostView) => {
      if (next.pin !== pin) return;
      syncClock(next.now);
      setView(next);
    };
    socket.on("host:state", onState);
    return () => {
      socket.off("host:state", onState);
    };
  }, [pin]);

  useOnConnect(() => {
    if (!hostKey) {
      setStatus("missing");
      return;
    }
    void request("host:resume", { pin, hostKey }).then((result) => setStatus(result.ok ? "ready" : "missing"));
  }, [pin, hostKey]);

  const act: Act = (action, extra) => {
    void request("host:action", { pin, hostKey, action, ...extra }).then((result) => {
      if (result.error) toast({ title: result.error });
    });
  };

  if (status === "missing") {
    return (
      <Container maxWidth="sm">
        <Stack paddingY="2xl">
          <EmptyState title={`Không mở được phòng ${pin}`} headingLevel={2} icon="icon-flag-01-line" primaryAction={{ label: "Tạo phòng mới", onClick: () => navigate("/host") }}>
            Phòng đã hết hạn, server vừa khởi động lại, hoặc phòng được tạo trên trình duyệt khác.
          </EmptyState>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Stack gap="lg" paddingY="lg">
        <TopBar pin={pin} view={view} act={act} />
        {connection === "reconnecting" && <AlertBanner theme="warning">Mất kết nối tới server, đang kết nối lại…</AlertBanner>}
        {view ? <Phase view={view} act={act} /> : <Text tone="base">Đang mở phòng…</Text>}
      </Stack>
    </Container>
  );
}

function TopBar({ pin, view, act }: { pin: string; view: HostView | null; act: Act }) {
  const playing = view && view.phase !== "lobby";
  return (
    <Stack direction="row" gap="sm" align="center" justify="between" wrap>
      <Stack direction="row" gap="sm" align="center">
        <DockIcon theme="emoji" emoji="🎮" size="sm" label="UIUX Warm-up" />
        <Text as="span" textStyle="Body/Base/Bold">
          UIUX Warm-up
        </Text>
        <Badge theme="pink" background="subtle" leadingIcon={false}>{`Phòng ${pin}`}</Badge>
      </Stack>
      <Stack direction="row" gap="xs" align="center">
        {view && (
          <Text as="span" textStyle="Body/Base/Medium" tone="base">
            {`${view.playerCount} người chơi`}
          </Text>
        )}
        <Menu
          align="end"
          trigger={<IconButton appearance="flat" level="primary" icon="icon-dots-horizontal-line" aria-label="Tuỳ chọn phòng" />}
          items={[
            ...(playing ? [{ id: "finish", label: "Kết thúc, xem kết quả", icon: "icon-flag-01-line" as const, onSelect: () => act("finish") }] : []),
            ...(playing ? [{ id: "restart", label: "Chơi lại từ đầu", icon: "icon-refresh-cw-01-line" as const, onSelect: () => act("restart") }] : []),
            { id: "new", label: "Tạo phòng mới", icon: "icon-plus-line" as const, onSelect: () => navigate("/host") },
          ]}
        />
      </Stack>
    </Stack>
  );
}

function SectionProgress({ view }: { view: HostView }) {
  if (view.sections.length < 2 || !view.section) return null;
  return (
    <Stepper
      aria-label="Tiến trình buổi chơi"
      current={view.section - 1}
      steps={view.sections.map((section) => ({ id: section.id, title: `${section.emoji} ${section.title}` }))}
    />
  );
}

function Phase({ view, act }: { view: HostView; act: Act }) {
  switch (view.phase) {
    case "lobby":
      return <Lobby view={view} act={act} />;
    case "intro":
      return <Intro view={view} act={act} />;
    case "question":
    case "reveal":
      return <Question view={view} act={act} />;
    case "challenge":
      return <Challenge view={view} act={act} />;
    case "leaderboard":
      return <Leaderboard view={view} act={act} />;
    case "final":
      return <Final view={view} act={act} />;
    default:
      return null;
  }
}

/* ── Phòng chờ ──────────────────────────────────────── */

function PlayerRow({ player, act, team }: { player: HostPlayer; act: Act; team: HostView["teams"][number] | null }) {
  return (
    <ListItem
      leading={<PlayerAvatar name={player.name} avatar={player.avatar} team={team} />}
      title={player.name}
      caption={[team ? `Team ${team.name}` : null, player.hasFact ? "Đã viết điều thú vị" : null, player.connected ? null : "Mất kết nối"].filter(Boolean).join(" · ") || undefined}
      trailing={
        <Menu
          align="end"
          trigger={<IconButton appearance="flat" level="primary" size="md" icon="icon-dots-horizontal-line" aria-label={`Tuỳ chọn cho ${player.name}`} />}
          items={[{ id: "kick", label: "Mời ra khỏi phòng", icon: "icon-user-x-line", danger: true, onSelect: () => act("kick", { playerId: player.id }) }]}
        />
      }
    />
  );
}

/** Học viên trong phòng chờ: avatar emoji lớn và tên, hiện ra kiểu "bật" lên khi vừa vào. */
function PlayerBubble({ player, team }: { player: HostPlayer; team: HostView["teams"][number] | null }) {
  return (
    <div className="pop-in">
      <Stack gap="2xs" align="center" width={88}>
        <PlayerAvatar name={player.name} avatar={player.avatar} team={team} size="xl" />
        <Text textStyle="Body/Small/Medium" align="center" truncate tone={player.connected ? "strongest" : "light"}>
          {player.name}
        </Text>
      </Stack>
    </div>
  );
}

function Lobby({ view, act }: { view: HostView; act: Act }) {
  const base = useJoinBase();
  const url = `${base}/join/${view.pin}`;
  const teamMode = view.settings.mode === "team";
  const count = view.playerCount;
  const byName = [...view.players].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  const [managing, setManaging] = useState(false);
  const asksFacts = view.sections.some((section) => section.id === "whois");

  return (
    <Stack gap="xl">
      <Grid columns={{ mobile: 1, tablet: 1, desktop: "minmax(0, 5fr) minmax(0, 7fr)" }} gap="xl">
        <Box surface="surface" radius="2xl" padding="2xl">
          <Stack gap="lg" align="center">
            <Heading level={1} textStyle="Heading/1" align="center">
              Quét mã để vào phòng
            </Heading>
            <JoinQr url={url} pin={view.pin} size={300} />
            <Stack gap="2xs" align="center">
              <Text tone="base" align="center">
                hoặc vào trang chủ và nhập mã phòng
              </Text>
              <Text as="span" textStyle="Display/1" tabularNumbers align="center" tone="accent-base">
                {view.pin}
              </Text>
            </Stack>
          </Stack>
        </Box>

        <Stack gap="md">
          <Stack direction="row" gap="xs" align="center" wrap>
            <Heading level={2} textStyle="Heading/4">
              Người chơi
            </Heading>
            {count > 0 && <BadgeCounter value={count} />}
            {asksFacts && count > 0 && (
              <Badge theme="violet" background="subtle" leadingIcon={false}>{`🕵️ ${view.factCount}/${count} bạn đã viết điều thú vị`}</Badge>
            )}
            <Stack direction="row" width="fill" justify="end">
              {count > 0 && (
                <Button level="tertiary" size="sm" startIcon="icon-users-line" onClick={() => setManaging(true)}>
                  Quản lý người chơi
                </Button>
              )}
            </Stack>
          </Stack>
          {count === 0 ? (
            <Box surface="surface" radius="2xl" padding="xl">
              <Stack gap="md" align="center" paddingY="xl">
                <HeroArt main="📱" bits={["🐶", "🦊", "🐼", "🦄"]} size="md" />
                <Heading level={3} textStyle="Heading/4" align="center">
                  Chưa có ai vào phòng
                </Heading>
                <Text tone="base" align="center">
                  Học viên quét mã QR, chọn avatar và nhập tên. Các bạn sẽ hiện ở đây.
                </Text>
              </Stack>
            </Box>
          ) : teamMode ? (
            <Grid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="md">
              {view.teams.map((team) => {
                const members = byName.filter((p) => p.teamId === team.id);
                return (
                  <Card key={team.id} theme="subtle" color={team.card} spacing="sm">
                    <Stack gap="sm">
                    <Stack direction="row" gap="sm" align="center">
                      <TeamMark team={team} size="sm" />
                      <Heading level={3} textStyle="Heading/Subheading" width="fill">
                        {`Team ${team.name}`}
                      </Heading>
                      <Text as="span" textStyle="Body/Small/Medium" tone="base">{`${members.length} người`}</Text>
                    </Stack>
                    {members.length ? (
                      <Stack direction="row" gap="sm" wrap>
                        {members.map((player) => (
                          <PlayerBubble key={player.id} player={player} team={team} />
                        ))}
                      </Stack>
                    ) : (
                      <Text textStyle="Body/Small/Regular" tone="base">
                        Chưa có thành viên
                      </Text>
                    )}
                    </Stack>
                  </Card>
                );
              })}
            </Grid>
          ) : (
            <Card theme="flat">
              <Stack direction="row" gap="sm" wrap>
                {byName.map((player) => (
                  <PlayerBubble key={player.id} player={player} team={null} />
                ))}
              </Stack>
            </Card>
          )}
          <SidePanel open={managing} onOpenChange={setManaging} title="Quản lý người chơi" description="Mời ra khỏi phòng một tên không phù hợp, hoặc xem ai đã viết điều thú vị.">
            <List aria-label="Người chơi trong phòng">
              {byName.map((player) => (
                <PlayerRow key={player.id} player={player} act={act} team={view.teams.find((t) => t.id === player.teamId) ?? null} />
              ))}
            </List>
          </SidePanel>
        </Stack>
      </Grid>

      <ActionBar
        direction="horizontal"
        summary={summaryText(count === 0 ? "Chờ học viên vào phòng để bắt đầu" : teamMode ? `${count} người chơi · ${view.teams.length} team` : `${count} người chơi`)}
        secondaryAction={teamMode && count > 1 ? { label: "Xáo lại team", onClick: () => act("shuffle") } : undefined}
        primaryAction={{ label: "Bắt đầu", onClick: () => act("next"), disabled: count === 0 }}
      />
    </Stack>
  );
}

/* ── Giới thiệu từng phần ───────────────────────────── */

function Intro({ view, act }: { view: HostView; act: Act }) {
  const game = view.step ? GAMES[view.step.game] : null;
  if (!game || !view.step) return null;
  return (
    <Stack gap="xl">
      <SectionProgress view={view} />
      <Stack gap="lg" align="center">
        <Card theme="subtle" color="brand" maxWidth={760} alignSelf="center">
          <Stack gap="md" align="center" paddingY="lg" paddingX="2xl">
            <HeroArt main={game.emoji} bits={game.art} size="xl" />
            <Text as="span" textStyle="Body/Extra/Medium" tone="base">{`Phần ${view.step.section}/${view.sections.length}`}</Text>
            {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
            <Heading level={1} textStyle="Display/2" align="center">
              {game.title}
            </Heading>
            <Text textStyle="Body/Extra/Regular" tone="base" align="center">
              {game.short}
            </Text>
          </Stack>
        </Card>
        <Box surface="surface" radius="2xl" padding="xl" maxWidth={760} width="fill">
          <Stack gap="md">
            <Heading level={2} textStyle="Heading/Subheading">
              Cách chơi
            </Heading>
            {game.howTo.map((line, index) => (
              <Stack key={line} direction="row" gap="sm" align="start">
                <BadgeCounter value={index + 1} />
                <Text textStyle="Body/Extra/Regular" width="fill">
                  {line}
                </Text>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>
      <ActionBar direction="horizontal" summary={summaryText("Học viên cũng đang xem hướng dẫn này trên điện thoại")} primaryAction={{ label: `Bắt đầu ${game.title}`, onClick: () => act("next") }} />
    </Stack>
  );
}

/* ── Câu hỏi và đáp án ──────────────────────────────── */

function Question({ view, act }: { view: HostView; act: Act }) {
  const step = view.step;
  if (!step) return null;
  const game = GAMES[step.game];
  const revealed = view.phase === "reveal";
  const answered = view.answeredCount;
  const online = view.players.filter((p) => p.connected).length;

  return (
    <Stack gap="xl">
      <SectionProgress view={view} />
      <Stack direction="row" gap="sm" align="center" justify="between" wrap>
        <GameBadge game={game.id}>{`${game.emoji} ${game.title} · Câu ${step.number}/${step.total}`}</GameBadge>
        <Text as="span" textStyle="Body/Extra/Medium" tone="base" role="status">
          {`${answered}/${online} đã trả lời`}
        </Text>
      </Stack>
      <Grid columns={{ mobile: 1, desktop: revealed ? 1 : "minmax(0, 1fr) 320px" }} gap="xl" align="center">
        {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
        <Heading level={1} textStyle="Display/3">
          {step.prompt}
        </Heading>
        {!revealed && <Timer startsAt={view.startsAt} endsAt={view.endsAt} size="lg" />}
      </Grid>
      {step.visual && (
        <Box maxWidth={step.visual.type === "emoji" || step.visual.type === "quote" ? 960 : 560} width="fill">
          <QuestionVisual visual={step.visual} large />
        </Box>
      )}
      <Answers step={step} state={revealed ? "reveal" : "waiting"} large />
      {revealed && step.explain && (
        <InlineMessage theme="info" title={step.principle ? `Nguyên tắc: ${step.principle}` : "Vì sao?"}>
          {step.explain}
        </InlineMessage>
      )}
      {revealed && step.game === "poll" && (
        <InlineMessage theme="info" title="Cả lớp đã chọn">
          {(step.majority ?? []).length > 1 ? "Hai bên bằng nhau, ai trả lời cũng được 500 điểm!" : "Ai chọn giống số đông được 500 điểm."}
        </InlineMessage>
      )}
      <ActionBar
        direction="horizontal"
        summary={summaryText(revealed ? "Đã công bố đáp án" : "Câu hỏi tự đóng khi hết giờ hoặc khi mọi người đã trả lời")}
        secondaryAction={revealed ? { label: view.isLastStep ? "Xem kết quả cuối" : "Bỏ qua xếp hạng", onClick: () => act("skip") } : undefined}
        primaryAction={revealed ? { label: "Xem xếp hạng", onClick: () => act("next") } : { label: "Hiện đáp án", onClick: () => act("next") }}
      />
    </Stack>
  );
}

/* ── Thử thách ──────────────────────────────────────── */

function rankByChallenge(players: HostPlayer[]) {
  const sorted = [...players].sort((a, b) => b.challengeScore - a.challengeScore || a.name.localeCompare(b.name, "vi"));
  let rank = 0;
  let previous: number | null = null;
  return sorted.map((player, index) => {
    if (player.challengeScore !== previous) rank = index + 1;
    previous = player.challengeScore;
    return { ...player, rank };
  });
}

function Challenge({ view, act }: { view: HostView; act: Act }) {
  const step = view.step;
  const now = useServerNow(200);
  const ranked = useMemo(() => rankByChallenge(view.players).slice(0, 10), [view.players]);
  if (!step) return null;
  const game = GAMES[step.game];
  const waiting = view.startsAt !== null && now < view.startsAt;
  const rounds = step?.game === "reaction" ? REACTION_ROUNDS : CENTER_ROUNDS;
  const finished = view.players.filter((p) => p.challengeRound >= rounds).length;

  return (
    <Stack gap="xl">
      <SectionProgress view={view} />
      <Grid columns={{ mobile: 1, desktop: "minmax(0, 1fr) 360px" }} gap="xl" align="center">
        <Stack direction="row" gap="md" align="center">
          <GameMark game={game.id} size="xl" />
          {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
          <Heading level={1} textStyle="Display/3">
            {game.title}
          </Heading>
        </Stack>
        {waiting ? (
          <Text textStyle="Display/2" align="end" tabularNumbers role="timer">
            {`Bắt đầu sau ${Math.max(1, Math.ceil((view.startsAt! - now) / 1000))}…`}
          </Text>
        ) : (
          <Timer startsAt={view.startsAt} endsAt={view.endsAt} size="lg" />
        )}
      </Grid>
      <Text textStyle="Body/Extra/Regular" tone="base">
        {step.game === "center"
          ? `Học viên đang chơi trên điện thoại · ${finished}/${view.playerCount} bạn đã xong ${CENTER_ROUNDS} hình`
          : step.game === "reaction"
            ? `Học viên đang chơi trên điện thoại · ${finished}/${view.playerCount} bạn đã xong ${REACTION_ROUNDS} lượt`
            : "Học viên đang chơi trên điện thoại · bảng điểm cập nhật trực tiếp"}
      </Text>
      <Grid columns={{ mobile: 1, desktop: view.settings.mode === "team" ? 2 : 1 }} gap="lg">
        <PlayerStandings players={ranked} teams={view.teams} title="Điểm lượt này" caption="10 bạn dẫn đầu" scoreOf={(player) => (player as HostPlayer).challengeScore} />
        {view.settings.mode === "team" && <TeamStandings teams={view.teams} scoreMode={view.settings.teamScore} />}
      </Grid>
      <ActionBar direction="horizontal" summary={summaryText("Lượt chơi tự kết thúc khi hết giờ")} primaryAction={{ label: "Kết thúc lượt chơi", onClick: () => act("next") }} />
    </Stack>
  );
}

/* ── Xếp hạng ───────────────────────────────────────── */

/** Đường đua các team: biểu đồ thanh khi có từ 3 team, danh sách khi chỉ có 2. */
function TeamRace({ view }: { view: HostView }) {
  if (view.teams.length < 3) return <TeamStandings teams={view.teams} scoreMode={view.settings.teamScore} />;
  return (
    <ChartCard title="Đường đua các team" headingLevel={2} icon="icon-trophy-01-solid" description={view.settings.teamScore === "avg" ? "Điểm trung bình mỗi thành viên" : "Tổng điểm của team"}>
      <BarList
        aria-label="Điểm các team"
        data={view.teams.map((team) => ({ label: `${medal(team.rank, team.score) ?? `${team.rank}.`} Team ${team.name}`, value: team.score }))}
        format={formatPoints}
        headers={{ label: "Team", value: "Điểm" }}
      />
    </ChartCard>
  );
}

function Leaderboard({ view, act }: { view: HostView; act: Act }) {
  const teamMode = view.settings.mode === "team";
  const game = view.step ? GAMES[view.step.game] : null;
  return (
    <Stack gap="xl">
      <SectionProgress view={view} />
      <Stack direction="row" gap="md" align="center">
        <DockIcon icon="icon-trophy-01-solid" theme="yellow" size="xl" label="Bảng xếp hạng" />
        <Stack gap="2xs">
          {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
          <Heading level={1} textStyle="Display/3">
            Bảng xếp hạng
          </Heading>
          {game && (
            <Text textStyle="Body/Extra/Regular" tone="base">
              {view.step?.kind === "challenge" ? `Sau lượt ${game.title}` : `Sau câu ${view.step?.number}/${view.step?.total} · ${game.title}`}
            </Text>
          )}
        </Stack>
      </Stack>
      <Grid columns={{ mobile: 1, desktop: teamMode ? 2 : 1 }} gap="lg">
        {teamMode && <TeamRace view={view} />}
        <PlayerStandings players={view.players.slice(0, 10)} teams={view.teams} caption={view.players.length > 10 ? "10 bạn dẫn đầu" : undefined} />
      </Grid>
      <ActionBar direction="horizontal" summary={summaryText(view.isLastStep ? "Đây là lượt cuối cùng" : undefined)} primaryAction={{ label: view.isLastStep ? "Xem kết quả cuối" : "Tiếp tục", onClick: () => act("next") }} />
    </Stack>
  );
}

/* ── Kết quả cuối ───────────────────────────────────── */

/** Bục nhận giải: chiều cao và màu của từng bậc. */
const PODIUM = [
  { height: 120, fill: "support-yellow-solid", tone: "on-brights" },
  { height: 88, fill: "support-cyan-solid", tone: "on-colors" },
  { height: 64, fill: "support-orange-solid", tone: "on-colors" },
] as const;

function Final({ view, act }: { view: HostView; act: Act }) {
  const teamMode = view.settings.mode === "team";
  const winner = teamMode ? view.teams[0] : null;
  const podium = view.players.slice(0, 3);
  // Bục nhận giải: hạng 2 · hạng 1 · hạng 3.
  const order = podium.length === 3 ? [podium[1], podium[0], podium[2]] : podium;

  return (
    <Stack gap="xl">
      <Confetti />
      <Card theme="subtle" color="brand">
        <Stack gap="sm" align="center" paddingY="sm">
          <HeroArt main="🏆" bits={["🎉", "⭐", "🎊", "✨"]} size="md" />
          {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
          <Heading level={1} textStyle="Display/2" align="center">
            Kết quả chung cuộc
          </Heading>
          {winner && winner.members > 0 && (
            <Stack direction="row" gap="sm" align="center">
              <TeamMark team={winner} size="lg" />
              <Text textStyle="Display/4">{`Team ${winner.name} vô địch với ${points(winner.score)}${view.settings.teamScore === "avg" ? " trung bình" : ""}!`}</Text>
            </Stack>
          )}
        </Stack>
      </Card>

      {podium.length > 0 && (
        <Grid columns={order.length} gap="md" align="end" maxWidth={960} alignSelf="center" width="fill">
          {order.map((player) => {
            const team = view.teams.find((t) => t.id === player.teamId) ?? null;
            const step = PODIUM[player.rank - 1] ?? PODIUM[2];
            return (
              <Stack key={player.id} gap="sm" align="center">
                <Text as="span" textStyle="Display/2" aria-hidden="true">
                  {medal(player.rank, player.score) ?? `${player.rank}`}
                </Text>
                <PlayerAvatar name={player.name} avatar={player.avatar} team={team} size={player.rank === 1 ? "3xl" : "2xl"} />
                <Heading level={2} textStyle="Heading/3" align="center">
                  {player.name}
                </Heading>
                {team && <TeamBadge team={team} />}
                <Text textStyle="Heading/4" tabularNumbers>{`${formatPoints(player.score)} điểm`}</Text>
                <Box width="fill" height={step.height} radiusTopLeft="2xl" radiusTopRight="2xl" clip>
                  <Shape position="absolute" constraintX="left-right" constraintY="top-bottom" type="rectangle" fill={step.fill} />
                  <Stack position="absolute" constraintX="left-right" constraintY="center" align="center">
                    <Text as="span" textStyle="Display/1" tone={step.tone} align="center">
                      {player.rank}
                    </Text>
                  </Stack>
                </Box>
              </Stack>
            );
          })}
        </Grid>
      )}

      <Grid columns={{ mobile: 1, desktop: teamMode ? 2 : 1 }} gap="lg">
        {teamMode && <TeamStandings teams={view.teams} scoreMode={view.settings.teamScore} />}
        <PlayerStandings players={view.players} teams={view.teams} title="Toàn bộ xếp hạng cá nhân" />
      </Grid>

      <ActionBar
        direction="horizontal"
        summary={summaryText("Cảm ơn cả lớp! Hẹn gặp ở buổi học đầu tiên.")}
        secondaryAction={{ label: "Tạo phòng mới", onClick: () => navigate("/host") }}
        primaryAction={{ label: "Chơi lại với lớp này", onClick: () => act("restart") }}
      />
    </Stack>
  );
}
