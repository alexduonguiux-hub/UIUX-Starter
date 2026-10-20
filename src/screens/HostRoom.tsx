import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  SidePanel,
  Stack,
  Stepper,
  Text,
  useToast,
} from "@zen-ds/react";
import { CENTER_ROUNDS, GAMES, MEMORY_PAIRS, REACTION_ROUNDS } from "../../shared/games.js";
import { Answers } from "../components/Answers";
import { GameBadge, GameMark, PlayerAvatar, QuestionVisual, TeamMark, Timer, summaryText } from "../components/common";
import { Confetti, Emoji, EmojiArt, HeroArt } from "../components/Fun";
import { JoinQr, useJoinBase } from "../components/JoinQr";
import { Podium, PlayerStandings, RankList, TeamStandings, rankEntries } from "../components/Standings";
import { EstimateAnswer, EstimateClosest, formatEstimate } from "../games/Estimate";
import { syncClock, useServerNow } from "../lib/clock";
import { formatPoints, points } from "../lib/format";
import { navigate } from "../lib/router";
import { request, socket, useConnection, useOnConnect } from "../lib/socket";
import { hostKeyFor, load } from "../lib/storage";
import type { HostPlayer, HostView } from "../lib/types";

type Act = (action: "next" | "skip" | "shuffle" | "restart" | "finish" | "kick", extra?: Record<string, unknown>) => void;

/*
 * Bố cục màn chiếu (desktop):
 * - Cả buổi chơi nằm gọn trong một khung 16:9, không cần cuộn: thanh trên · tiến trình · sân khấu · thanh hành động.
 * - Sân khấu chia hai cột khi có hai loại nội dung (hình và đáp án, bục và danh sách) thay vì xếp chồng xuống dưới.
 * - Chữ theo thang "popular" của Zen (tiêu đề 46–60px, chữ nhỏ nhất 18px) để đọc được từ cuối lớp.
 * - Lề an toàn theo chiều rộng màn hình, vì nhiều máy chiếu cắt mất mép hình.
 */

/** Số dòng của một danh sách điểm vừa với sân khấu ở chiều cao màn chiếu hiện tại (mỗi dòng khoảng 72px). */
function useListRows(max: number) {
  const height = useViewportHeight();
  return Math.max(3, Math.min(max, Math.floor((height - 420) / 72)));
}

/** Chiều cao cửa sổ, để mã QR và bục nhận giải co giãn theo màn chiếu. */
function useViewportHeight() {
  const [height, setHeight] = useState(() => window.innerHeight);
  useEffect(() => {
    const onResize = () => setHeight(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return height;
}

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
    <div className="host">
      <TopBar pin={pin} view={view} act={act} />
      {connection === "reconnecting" && <AlertBanner theme="warning">Mất kết nối tới server, đang kết nối lại…</AlertBanner>}
      {view ? <Phase view={view} act={act} /> : <Text tone="base">Đang mở phòng…</Text>}
    </div>
  );
}

function TopBar({ pin, view, act }: { pin: string; view: HostView | null; act: Act }) {
  const playing = view && view.phase !== "lobby";
  return (
    <Stack direction="row" gap="sm" align="center" justify="between" wrap>
      <Stack direction="row" gap="sm" align="center">
        <DockIcon theme="emoji" emoji={<Emoji>🎮</Emoji>} size="sm" label="UIUX Warm-up" />
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
    <div className="host-progress">
      <Stepper
        aria-label="Tiến trình buổi chơi"
        current={view.section - 1}
        steps={view.sections.map((section) => ({
          id: section.id,
          title: (
            <>
              <Emoji>{section.emoji}</Emoji> {section.title}
            </>
          ),
        }))}
      />
    </div>
  );
}

/**
 * Khung của một màn: phần đầu (tiến trình, tiêu đề), sân khấu chiếm hết chiều cao còn lại và thanh hành động.
 * `layout`: "split" hai cột 5/7 · "board" hai cột 7/5 · "half" hai cột bằng nhau · "single" một cột.
 */
function Stage({ head, layout = "single", footer, children }: { head?: ReactNode; layout?: "single" | "split" | "board" | "half"; footer: ReactNode; children: ReactNode }) {
  return (
    <div className="host-phase">
      {head}
      <div className={`host-main host-main--${layout}`}>{children}</div>
      {footer}
    </div>
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
      <Stack gap="2xs" align="center" width={112}>
        <PlayerAvatar name={player.name} avatar={player.avatar} team={team} size="xl" />
        <Text textStyle="Body/Base/Medium" align="center" truncate={2} tone={player.connected ? "strongest" : "light"}>
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
  const height = useViewportHeight();
  const qrSize = Math.round(Math.min(340, Math.max(180, height * (height < 760 ? 0.3 : 0.34))));

  return (
    <Stage
      layout="split"
      footer={
        <ActionBar
          direction="horizontal"
          summary={summaryText(count === 0 ? "Chờ học viên vào phòng để bắt đầu" : teamMode ? `${count} người chơi · ${view.teams.length} team` : `${count} người chơi`)}
          secondaryAction={teamMode && count > 1 ? { label: "Xáo lại team", onClick: () => act("shuffle") } : undefined}
          primaryAction={{ label: "Bắt đầu", onClick: () => act("next"), disabled: count === 0 }}
        />
      }
    >
      <Box surface="surface" radius="2xl" padding="xl">
        <Stack gap="md" align="center" justify="center" height="fill">
          <Heading level={1} textStyle="Heading/1" align="center">
            Quét mã để vào phòng
          </Heading>
          <JoinQr url={url} pin={view.pin} size={qrSize} />
          <Stack gap="none" align="center">
            <Text tone="base" align="center">
              hoặc vào trang chủ và nhập mã phòng
            </Text>
            <Text as="span" textStyle="Display-Extra/1" tabularNumbers align="center" tone="accent-base">
              {view.pin}
            </Text>
          </Stack>
        </Stack>
      </Box>

      <div className="host-column">
        <Stack direction="row" gap="xs" align="center" wrap>
          <Heading level={2} textStyle="Heading/2">
            Người chơi
          </Heading>
          {count > 0 && <BadgeCounter value={count} />}
          {asksFacts && count > 0 && (
            <Badge theme={GAMES.whois.theme} background="subtle" leading={<Emoji>🕵️</Emoji>}>{`${view.factCount}/${count} bạn đã viết điều thú vị`}</Badge>
          )}
          <Stack direction="row" width="fill" justify="end">
            {count > 0 && (
              <Button level="tertiary" size="sm" startIcon="icon-users-line" onClick={() => setManaging(true)}>
                Quản lý người chơi
              </Button>
            )}
          </Stack>
        </Stack>
        <div className="host-scroll">
          {count === 0 ? (
            <Box surface="surface" radius="2xl" padding="xl" height="fill">
              <Stack gap="md" align="center" justify="center" height="fill">
                <HeroArt main="📱" bits={["🐶", "🦊", "🐼", "🦄"]} size="lg" />
                <Heading level={3} textStyle="Heading/2" align="center">
                  Chưa có ai vào phòng
                </Heading>
                <Text textStyle="Body/Extra/Regular" tone="base" align="center">
                  Học viên quét mã QR, chọn avatar và nhập tên. Các bạn sẽ hiện ở đây.
                </Text>
              </Stack>
            </Box>
          ) : teamMode ? (
            <Grid columns={{ mobile: 1, tablet: 2, desktop: view.teams.length > 4 ? 3 : 2 }} gap="md">
              {view.teams.map((team) => {
                const members = byName.filter((p) => p.teamId === team.id);
                return (
                  <Card key={team.id} theme="subtle" color={team.card} spacing="sm">
                    <Stack gap="sm">
                      <Stack direction="row" gap="sm" align="center">
                        <TeamMark team={team} size="sm" />
                        <Heading level={3} textStyle="Heading/4" width="fill">
                          {`Team ${team.name}`}
                        </Heading>
                        <Text as="span" textStyle="Body/Base/Medium" tone="base">{`${members.length} người`}</Text>
                      </Stack>
                      {members.length ? (
                        <Stack direction="row" gap="sm" wrap>
                          {members.map((player) => (
                            <PlayerBubble key={player.id} player={player} team={team} />
                          ))}
                        </Stack>
                      ) : (
                        <Text textStyle="Body/Base/Regular" tone="base">
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
        </div>
        <SidePanel open={managing} onOpenChange={setManaging} title="Quản lý người chơi" description="Mời ra khỏi phòng một tên không phù hợp, hoặc xem ai đã viết điều thú vị.">
          <List aria-label="Người chơi trong phòng">
            {byName.map((player) => (
              <PlayerRow key={player.id} player={player} act={act} team={view.teams.find((t) => t.id === player.teamId) ?? null} />
            ))}
          </List>
        </SidePanel>
      </div>
    </Stage>
  );
}

/* ── Giới thiệu từng phần ───────────────────────────── */

function Intro({ view, act }: { view: HostView; act: Act }) {
  const game = view.step ? GAMES[view.step.game] : null;
  if (!game || !view.step) return null;
  return (
    <Stage
      head={<SectionProgress view={view} />}
      layout="half"
      footer={<ActionBar direction="horizontal" summary={summaryText("Học viên cũng đang xem hướng dẫn này trên điện thoại")} primaryAction={{ label: `Bắt đầu ${game.title}`, onClick: () => act("next") }} />}
    >
      <Card theme="subtle" color={game.card}>
        <Stack gap="md" align="center" justify="center" height="fill" paddingY="lg">
          <HeroArt main={game.emoji} bits={game.art} size="xl" />
          <Text as="span" textStyle="Heading/4" tone="base">{`Phần ${view.step.section}/${view.sections.length}`}</Text>
          {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
          <Heading level={1} textStyle="Display/1" align="center">
            {game.title}
          </Heading>
          <Text textStyle="Body/Extra/Regular" tone="base" align="center">
            {game.short}
          </Text>
        </Stack>
      </Card>
      <Box surface="surface" radius="2xl" padding="2xl">
        <Stack gap="lg" justify="center" height="fill">
          <Heading level={2} textStyle="Heading/2">
            Cách chơi
          </Heading>
          {game.howTo.map((line, index) => (
            <Stack key={line} direction="row" gap="md" align="start">
              <BadgeCounter value={index + 1} />
              <Text textStyle="Heading/4" width="fill">
                {line}
              </Text>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Stage>
  );
}

/* ── Câu hỏi và đáp án ──────────────────────────────── */

function Question({ view, act }: { view: HostView; act: Act }) {
  const step = view.step;
  // Màn chiếu thấp (dưới 760px): tiêu đề nhỏ hơn một bậc để đáp án vẫn nằm gọn trong khung.
  const compact = useViewportHeight() < 760;
  if (!step) return null;
  const game = GAMES[step.game];
  const revealed = view.phase === "reveal";
  const answered = view.answeredCount;
  const online = view.players.filter((p) => p.connected).length;
  const range = step.range;
  const note =
    revealed && step.explain ? (
      <InlineMessage theme="info" title={step.principle ? `Nguyên tắc: ${step.principle}` : "Vì sao?"}>
        {step.explain}
      </InlineMessage>
    ) : revealed && step.game === "poll" ? (
      <InlineMessage theme="info" title="Cả lớp đã chọn">
        {(step.majority ?? []).length > 1 ? "Hai bên bằng nhau, ai trả lời cũng được 500 điểm!" : "Ai chọn giống số đông được 500 điểm."}
      </InlineMessage>
    ) : null;

  const head = (
    <>
      <SectionProgress view={view} />
      <Stack direction="row" gap="sm" align="center" justify="between" wrap>
        <GameBadge game={game.id}>{`${game.title} · Câu ${step.number}/${step.total}`}</GameBadge>
        <Text as="span" textStyle="Heading/4" tone="base" role="status">
          {`${answered}/${online} đã trả lời`}
        </Text>
      </Stack>
      {/* Khi công bố, lời giải thích nằm ở chỗ của đồng hồ, để đáp án giữ nguyên chỗ trên sân khấu. */}
      <Grid columns={{ mobile: 1, desktop: revealed ? (note ? "minmax(0, 1fr) minmax(0, 520px)" : 1) : "minmax(0, 1fr) 340px" }} gap="xl" align="center">
        {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
        <Heading level={1} textStyle={compact ? "Heading/1" : "Display/3"}>
          {step.prompt}
        </Heading>
        {revealed ? note : <Timer startsAt={view.startsAt} endsAt={view.endsAt} size="lg" />}
      </Grid>
    </>
  );

  const footer = (
    <ActionBar
      direction="horizontal"
      summary={summaryText(revealed ? "Đã công bố đáp án" : "Câu hỏi tự đóng khi hết giờ hoặc khi mọi người đã trả lời")}
      secondaryAction={revealed ? { label: view.isLastStep ? "Xem kết quả cuối" : "Bỏ qua xếp hạng", onClick: () => act("skip") } : undefined}
      primaryAction={revealed ? { label: "Xem xếp hạng", onClick: () => act("next") } : { label: "Hiện đáp án", onClick: () => act("next") }}
    />
  );

  // Đoán gần đúng: hình bên trái; bên phải là lời nhắc khi đang chơi, đáp án và các bạn đoán sát nhất khi công bố.
  if (range) {
    return (
      <Stage head={head} layout="split" footer={footer}>
        {revealed ? (
          <Box surface="surface" radius="2xl" padding="xl">
            <Stack justify="center" height="fill">
              <EstimateAnswer step={step} large />
            </Stack>
          </Box>
        ) : (
          <div className="host-visual">{step.visual && <QuestionVisual visual={step.visual} large />}</div>
        )}
        {revealed ? (
          <Box surface="surface" radius="2xl" padding="xl">
            <EstimateClosest step={step} large={!compact} />
          </Box>
        ) : (
          <Box surface="surface" radius="2xl" padding="2xl">
            <Stack gap="md" align="center" justify="center" height="fill">
              <EmojiArt size="xl" float>
                🤔
              </EmojiArt>
              <Text textStyle="Display/4" align="center">
                Học viên đang kéo thanh trượt trên điện thoại
              </Text>
              <Text textStyle="Body/Extra/Regular" tone="base" align="center">
                {`Đáp án nằm trong khoảng ${formatEstimate(range.min, range.unit)} đến ${formatEstimate(range.max, range.unit)}. Ai đoán sát nhất được nhiều điểm nhất.`}
              </Text>
            </Stack>
          </Box>
        )}
      </Stage>
    );
  }

  // Có hình minh hoạ: hình bên trái, đáp án bên phải. Không có hình: đáp án chiếm cả sân khấu.
  const answers = (
    <div className="host-column">
      <Answers step={step} state={revealed ? "reveal" : "waiting"} large dense={compact} />
    </div>
  );
  if (step.visual) {
    return (
      <Stage head={head} layout="split" footer={footer}>
        <div className="host-visual">
          <QuestionVisual visual={step.visual} large />
        </div>
        {answers}
      </Stage>
    );
  }
  return (
    <Stage head={head} footer={footer}>
      <div className="host-column host-answers-fill">
        <Answers step={step} state={revealed ? "reveal" : "waiting"} large dense={compact} />
      </div>
    </Stage>
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
  const rows = useListRows(8);
  const ranked = useMemo(() => rankByChallenge(view.players).slice(0, rows), [view.players, rows]);
  if (!step) return null;
  const game = GAMES[step.game];
  const waiting = view.startsAt !== null && now < view.startsAt;
  const rounds = step.game === "reaction" ? REACTION_ROUNDS : step.game === "memory" ? 1 : CENTER_ROUNDS;
  const finished = view.players.filter((p) => p.challengeRound >= rounds).length;
  const teamMode = view.settings.mode === "team";
  const progress =
    step.game === "center"
      ? `${finished}/${view.playerCount} bạn đã xong ${CENTER_ROUNDS} hình`
      : step.game === "reaction"
        ? `${finished}/${view.playerCount} bạn đã xong ${REACTION_ROUNDS} lượt`
        : step.game === "memory"
          ? `${finished}/${view.playerCount} bạn đã ghép xong ${MEMORY_PAIRS} cặp`
          : step.game === "tap"
            ? "Cả lớp đang bấm, điểm team cộng dồn"
            : "Bảng điểm cập nhật trực tiếp";

  return (
    <Stage
      head={
        <>
          <SectionProgress view={view} />
          <Grid columns={{ mobile: 1, desktop: "minmax(0, 1fr) 360px" }} gap="xl" align="center">
            <Stack direction="row" gap="md" align="center">
              <GameMark game={game.id} size="xl" />
              <Stack gap="2xs">
                {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
                <Heading level={1} textStyle="Display/3">
                  {game.title}
                </Heading>
                <Text textStyle="Body/Extra/Regular" tone="base">
                  {progress}
                </Text>
              </Stack>
            </Stack>
            {waiting ? (
              <Text textStyle="Display/2" align="end" tabularNumbers role="timer">
                {`Bắt đầu sau ${Math.max(1, Math.ceil((view.startsAt! - now) / 1000))}…`}
              </Text>
            ) : (
              <Timer startsAt={view.startsAt} endsAt={view.endsAt} size="lg" />
            )}
          </Grid>
        </>
      }
      layout={teamMode ? "half" : "single"}
      footer={<ActionBar direction="horizontal" summary={summaryText("Lượt chơi tự kết thúc khi hết giờ")} primaryAction={{ label: "Kết thúc lượt chơi", onClick: () => act("next") }} />}
    >
      <div className="host-scroll">
        <PlayerStandings players={ranked} teams={view.teams} title="Điểm lượt này" caption={`${ranked.length} bạn dẫn đầu`} scoreOf={(player) => (player as HostPlayer).challengeScore} />
      </div>
      {teamMode && (
        <div className="host-scroll">
          <TeamRace view={view} />
        </div>
      )}
    </Stage>
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
        data={view.teams.map((team) => ({ label: `${team.rank}. Team ${team.name}`, value: team.score }))}
        format={formatPoints}
        headers={{ label: "Team", value: "Điểm" }}
      />
    </ChartCard>
  );
}

/** Số hàng xếp hạng (từ hạng 4) vừa với chiều cao màn chiếu, để không phải cuộn. */
function useBoardRows(view: HostView) {
  const height = useViewportHeight();
  const stage = height - 290;
  const race = view.settings.mode === "team" ? 130 + view.teams.length * 44 : 0;
  return Math.max(view.settings.mode === "team" ? 0 : 2, Math.min(5, Math.floor((stage - race - 40) / 76)));
}

/** Cột phải của bảng xếp hạng: đường đua các team (chơi theo team), rồi các hạng tiếp theo vừa với màn hình. */
function BoardSide({ view, extra }: { view: HostView; extra?: ReactNode }) {
  const rows = useBoardRows(view);
  const rest = rankEntries(view.players.slice(3, 3 + rows), view.teams);
  return (
    <div className="host-column host-scroll">
      {view.settings.mode === "team" && <TeamRace view={view} />}
      <RankList entries={rest} label="Các hạng tiếp theo" large />
      {extra}
    </div>
  );
}

function Leaderboard({ view, act }: { view: HostView; act: Act }) {
  const game = view.step ? GAMES[view.step.game] : null;
  const side = view.players.length > 3 || view.settings.mode === "team";
  return (
    <Stage
      head={
        <>
          <Stack direction="row" gap="md" align="baseline" wrap>
            {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
            <Heading level={1} textStyle="Display/3">
              Bảng xếp hạng
            </Heading>
            {game && (
              <Text textStyle="Heading/4" tone="base">
                {view.step?.kind === "challenge" ? `Sau lượt ${game.title}` : `Sau câu ${view.step?.number}/${view.step?.total} · ${game.title}`}
              </Text>
            )}
          </Stack>
        </>
      }
      layout={side ? "board" : "single"}
      footer={<ActionBar direction="horizontal" summary={summaryText(view.isLastStep ? "Đây là lượt cuối cùng" : undefined)} primaryAction={{ label: view.isLastStep ? "Xem kết quả cuối" : "Tiếp tục", onClick: () => act("next") }} />}
    >
      <div className="host-podium">
        <Podium entries={rankEntries(view.players.slice(0, 3), view.teams)} size="lg" label="Top 3 cả lớp" />
      </div>
      {side && <BoardSide view={view} />}
    </Stage>
  );
}

/* ── Kết quả cuối ───────────────────────────────────── */

function Final({ view, act }: { view: HostView; act: Act }) {
  const teamMode = view.settings.mode === "team";
  const winner = teamMode ? view.teams[0] : null;
  const side = view.players.length > 3 || teamMode;

  return (
    <Stage
      head={
        <Stack direction="row" gap="lg" align="center" justify="between" wrap>
          <Stack direction="row" gap="md" align="center">
            <EmojiArt size="md" float>
              🏆
            </EmojiArt>
            {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
            <Heading level={1} textStyle="Display/3">
              Kết quả chung cuộc
            </Heading>
          </Stack>
          {winner && winner.members > 0 && (
            <Card theme="subtle" color={winner.card} spacing="sm">
              <Stack direction="row" gap="sm" align="center">
                <TeamMark team={winner} size="lg" />
                <Stack gap="none">
                  <Text textStyle="Heading/3">{`Team ${winner.name} vô địch!`}</Text>
                  <Text textStyle="Body/Extra/Regular" tone="base">{`${points(winner.score)}${view.settings.teamScore === "avg" ? " trung bình mỗi bạn" : ""}`}</Text>
                </Stack>
              </Stack>
            </Card>
          )}
        </Stack>
      }
      layout={side ? "board" : "single"}
      footer={
        <ActionBar
          direction="horizontal"
          summary={summaryText("Cảm ơn cả lớp! Hẹn gặp ở buổi học đầu tiên.")}
          secondaryAction={{ label: "Tạo phòng mới", onClick: () => navigate("/host") }}
          primaryAction={{ label: "Chơi lại với lớp này", onClick: () => act("restart") }}
        />
      }
    >
      <Confetti />
      <div className="host-podium">
        <Podium entries={rankEntries(view.players.slice(0, 3), view.teams)} size="lg" label="Top 3 chung cuộc" />
      </div>
      {side && <BoardSide view={view} />}
    </Stage>
  );
}
