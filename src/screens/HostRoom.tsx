import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import {
  ActionBar,
  AlertBanner,
  Badge,
  BadgeCounter,
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
  ProgressBar,
  SidePanel,
  Stack,
  Stepper,
  Text,
  useToast,
} from "@zen-ds/react";
import { CENTER_ROUNDS, GAMES, MEMORY_PAIRS, REACTION_ROUNDS } from "../../shared/games.js";
import { Answers } from "../components/Answers";
import { GameBadge, GameMark, PlayerAvatar, QuestionVisual, TeamMark, Timer, summaryText, useViewportHeight } from "../components/common";
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

/**
 * Số dòng của một danh sách điểm vừa với cột chứa nó, đo trực tiếp: vị trí dòng đầu, chiều cao một dòng và
 * lề dưới của hộp danh sách. Đo lại khi cột đổi cỡ (đổi màn chiếu, bật/tắt thanh tiến trình).
 */
function useRowsThatFit(ref: RefObject<HTMLDivElement | null>, max: number, min = 3) {
  const [rows, setRows] = useState(max);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const items = el.querySelectorAll("li");
      if (!items.length) return;
      const box = el.getBoundingClientRect();
      const first = items[0].getBoundingClientRect();
      // Bước giữa hai hàng đo thật (chiều cao hàng cộng khoảng cách), không đoán.
      const pitch = items.length > 1 ? items[1].getBoundingClientRect().top - first.top : first.height + 2;
      // Phần không phải hàng (tiêu đề, lề trong của khung danh sách) đo từ chiều cao thật của khối đang hiện.
      const content = el.firstElementChild?.getBoundingClientRect().height ?? first.top - box.top + first.height;
      const extra = content - ((items.length - 1) * pitch + first.height);
      const fit = Math.floor((el.clientHeight - extra - first.height) / pitch) + 1;
      setRows(Math.max(min, Math.min(max, fit)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, max, min]);
  return rows;
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
      {/* Dải đầu màn chiếu, tràn hai mép như thanh hành động ở đáy: thanh trên và tiến trình buổi chơi bám vào một khối. */}
      <header className="host-header">
        <TopBar pin={pin} view={view} act={act} />
        {view && view.phase !== "lobby" && view.phase !== "final" && <SectionProgress view={view} />}
      </header>
      {connection === "reconnecting" && <AlertBanner theme="warning">Mất kết nối tới server, đang kết nối lại…</AlertBanner>}
      {view ? <Phase view={view} act={act} /> : <Text tone="base">Đang mở phòng…</Text>}
    </div>
  );
}

function TopBar({ pin, view, act }: { pin: string; view: HostView | null; act: Act }) {
  const playing = view && view.phase !== "lobby";
  // Cách vào phòng luôn hiện trên đầu màn chiếu (như Slido, Mentimeter) để bạn đến muộn vẫn vào được khi đang chơi.
  const site = useJoinBase().replace(/^https?:\/\//, "");
  return (
    <Stack direction="row" gap="sm" align="center" justify="between" wrap>
      <Stack direction="row" gap="sm" align="center">
        <DockIcon theme="emoji" emoji={<Emoji>🎮</Emoji>} size="sm" label="UIUX Warm-up" />
        <Text as="span" textStyle="Body/Base/Bold">
          UIUX Warm-up
        </Text>
        <Badge theme="pink" background="subtle" leadingIcon={false}>{`Phòng ${pin}`}</Badge>
      </Stack>
      <Stack direction="row" gap="md" align="center">
        {playing && (
          <Text as="span" textStyle="Body/Base/Regular" tone="base">
            {`Vào muộn? Mở ${site} và nhập mã ${pin}`}
          </Text>
        )}
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
  // Nhiều hơn 7 phần thì Stepper quá chật (nhãn xuống hai dòng): thay bằng một dòng "Phần x/y" và thanh tiến trình.
  if (view.sections.length > 7) {
    const current = view.sections[view.section - 1];
    const next = view.sections[view.section];
    return (
      <div className="host-progress">
        <Stack gap="xs">
          <Stack direction="row" gap="xs" align="center" wrap>
            <Text as="span" textStyle="Body/Base/Medium" tone="base">{`Phần ${view.section}/${view.sections.length}`}</Text>
            <Text as="span" textStyle="Body/Base/Bold">
              <Emoji>{current.emoji}</Emoji> {current.title}
            </Text>
            {next && (
              <Text as="span" textStyle="Body/Base/Regular" tone="base">
                · Tiếp theo: <Emoji>{next.emoji}</Emoji> {next.title}
              </Text>
            )}
          </Stack>
          <ProgressBar value={(view.section / view.sections.length) * 100} theme="accent" aria-label="Tiến trình buổi chơi" />
        </Stack>
      </div>
    );
  }
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
function PlayerBubble({ player, team, compact = false }: { player: HostPlayer; team: HostView["teams"][number] | null; compact?: boolean }) {
  return (
    <div className="pop-in">
      <Stack gap="2xs" align="center" width={compact ? 72 : 88}>
        <PlayerAvatar name={player.name} avatar={player.avatar} team={team} size={compact ? "lg" : "xl"} />
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
  // Lớp đông (trên 12 bạn) hoặc màn chiếu thấp: avatar nhỏ hơn một bậc để hiện được nhiều bạn hơn trước khi phải cuộn.
  const compact = count > 12 || height < 700;
  // Mã QR, tiêu đề và mã phòng co theo chiều cao màn chiếu: laptop phóng to 150% chỉ còn khoảng 600px.
  const short = height < 700;
  const qrSize = Math.round(Math.min(340, Math.max(140, height * (height < 760 ? 0.28 : 0.34))));

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
          <Heading level={1} textStyle={short ? "Heading/2" : "Heading/1"} align="center">
            Quét mã để vào phòng
          </Heading>
          <JoinQr url={url} pin={view.pin} size={qrSize} />
          <Stack gap="none" align="center">
            <Text tone="base" align="center">
              hoặc vào trang chủ và nhập mã phòng
            </Text>
            <Text as="span" textStyle={short ? "Display/1" : "Display-Extra/1"} tabularNumbers align="center" tone="accent-base">
              {view.pin}
            </Text>
          </Stack>
        </Stack>
      </Box>

      <div className="host-column">
        {/* Tiêu đề và nhãn bên trái, nút quản lý bên phải; màn hẹp thì nút xuống dòng thay vì đè lên nhãn. */}
        <Stack direction="row" gap="sm" align="center" justify="between" wrap>
          <Stack direction="row" gap="xs" align="center" wrap>
            <Heading level={2} textStyle="Heading/2">
              Người chơi
            </Heading>
            {count > 0 && <BadgeCounter value={count} />}
            {asksFacts && count > 0 && (
              <Badge theme={GAMES.whois.theme} background="subtle" leading={<Emoji>🕵️</Emoji>}>{`${view.factCount}/${count} bạn đã viết điều thú vị`}</Badge>
            )}
          </Stack>
          {count > 0 && (
            <Button level="tertiary" size="sm" startIcon="icon-users-line" onClick={() => setManaging(true)}>
              Quản lý người chơi
            </Button>
          )}
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
            <Grid
              // Số cột theo bề rộng thật của cột phải: mỗi thẻ team rộng tối thiểu 240px, đủ cho "Team Vector" trên một dòng.
              // Màn chiếu thấp: thẻ hẹp hơn (210px) để 3 team nằm một hàng, khỏi phải cuộn.
              columns={{ mobile: 1, tablet: `repeat(auto-fill, minmax(${short ? 210 : 240}px, 1fr))`, desktop: `repeat(auto-fill, minmax(${short ? 210 : 240}px, 1fr))` }}
              gap="md"
            >
              {view.teams.map((team) => {
                const members = byName.filter((p) => p.teamId === team.id);
                return (
                  <Card key={team.id} theme="subtle" color={team.card} spacing="sm">
                    <Stack gap="sm">
                      <Stack direction="row" gap="sm" align="center">
                        <TeamMark team={team} size="sm" />
                        <Stack gap="none" width="fill">
                          <Heading level={3} textStyle={short ? "Body/Extra/Bold" : "Heading/4"} truncate>
                            {`Team ${team.name}`}
                          </Heading>
                          <Text as="span" textStyle="Body/Base/Regular" tone="base">{`${members.length} người`}</Text>
                        </Stack>
                      </Stack>
                      {members.length ? (
                        // Canh mép trên: tên một dòng hay hai dòng thì các avatar vẫn thẳng một hàng.
                        <Stack direction="row" gap="sm" align="start" wrap>
                          {members.map((player) => (
                            <PlayerBubble key={player.id} player={player} team={team} compact={compact} />
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
              <Stack direction="row" gap="sm" align="start" wrap>
                {byName.map((player) => (
                  <PlayerBubble key={player.id} player={player} team={null} compact={compact} />
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
  // Màn chiếu thấp (laptop phóng to 150%): chữ nhỏ một bậc để cả thẻ vừa khung, không phải cuộn.
  const short = useViewportHeight() < 700;
  if (!game || !view.step) return null;
  // Một thẻ "sẵn sàng" theo màu trò chơi (như màn chờ câu hỏi của Kahoot): hình bên trái, tên và cách chơi bên phải.
  return (
    <Stage
      footer={<ActionBar direction="horizontal" summary={summaryText("Học viên cũng đang xem hướng dẫn này trên điện thoại")} primaryAction={{ label: `Bắt đầu ${game.title}`, onClick: () => act("next") }} />}
    >
      <Card theme="subtle" color={game.card} className="host-intro">
        <Stack paddingX="2xl" paddingY={short ? "sm" : "xl"}>
          <Grid columns={{ mobile: 1, desktop: "minmax(0, 5fr) minmax(0, 7fr)" }} gap="2xl" align="center">
            <div className="intro-art">
              <HeroArt main={game.emoji} bits={game.art} size="xl" />
            </div>
            <Stack gap={short ? "lg" : "xl"}>
              <Stack gap="xs">
                <Text as="span" textStyle="Heading/4" tone="base">{`Phần ${view.step.section}/${view.sections.length}`}</Text>
                {/* zen-allow-h1-style: màn hình chiếu, cả lớp đọc từ xa nên tiêu đề dùng cỡ Display */}
                <Heading level={1} textStyle={short ? "Display/3" : "Display/1"}>
                  {game.title}
                </Heading>
                <Text textStyle="Body/Extra/Regular" tone="base">
                  {game.short}
                </Text>
              </Stack>
              <Stack gap={short ? "sm" : "md"}>
                <Heading level={2} textStyle={short ? "Heading/4" : "Heading/3"}>
                  Cách chơi
                </Heading>
                {game.howTo.map((line, index) => (
                  <Stack key={line} direction="row" gap="md" align="start">
                    <BadgeCounter value={index + 1} />
                    <Text textStyle={short ? "Body/Extra/Medium" : "Heading/4"} width="fill">
                      {line}
                    </Text>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Grid>
        </Stack>
      </Card>
    </Stage>
  );
}

/* ── Câu hỏi và đáp án ──────────────────────────────── */

function Question({ view, act }: { view: HostView; act: Act }) {
  const step = view.step;
  // Màn chiếu thấp (dưới 760px): tiêu đề nhỏ hơn một bậc để đáp án vẫn nằm gọn trong khung.
  // Rất thấp (dưới 700px, laptop phóng to 150%): đáp án xếp một hàng; khi công bố bỏ hình để nhường chỗ cho số người chọn.
  const height = useViewportHeight();
  const compact = height < 760;
  const tight = height < 700;
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
      <Stack direction="row" gap="sm" align="center" justify="between" wrap>
        <GameBadge game={game.id}>{`${game.title} · Câu ${step.number}/${step.total}`}</GameBadge>
        <Text as="span" textStyle="Heading/4" tone="base" role="status">
          {`${answered}/${online} đã trả lời`}
        </Text>
      </Stack>
      {/* Khi công bố, lời giải thích nằm ở chỗ của đồng hồ, để đáp án giữ nguyên chỗ trên sân khấu. */}
      <Grid columns={{ mobile: 1, desktop: revealed ? (note ? "minmax(0, 1fr) minmax(0, 520px)" : 1) : "minmax(0, 1fr) auto" }} gap="xl" align="center">
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

  // Đoán gần đúng: hai ô cao bằng nhau. Khi chơi: hình bên trái, lời nhắc bên phải. Khi công bố: đáp án và các bạn đoán sát nhất.
  if (range) {
    return (
      <Stage head={head} layout={revealed ? "split" : "half"} footer={footer}>
        {revealed ? (
          <Box surface="surface" radius="2xl" padding="xl">
            <Stack justify="center" height="fill">
              <EstimateAnswer step={step} large />
            </Stack>
          </Box>
        ) : (
          step.visual && <QuestionVisual visual={step.visual} large fill />
        )}
        {revealed ? (
          <Box surface="surface" radius="2xl" padding="xl">
            <EstimateClosest step={step} large={!compact} limit={tight ? 2 : undefined} />
          </Box>
        ) : (
          <Box surface="surface" radius="2xl" padding="2xl">
            <Stack gap="md" align="center" justify="center" height="fill">
              <EmojiArt size={compact ? "lg" : "xl"} float>
                🤔
              </EmojiArt>
              <Text textStyle={compact ? "Heading/2" : "Display/4"} align="center">
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

  // Có hình minh hoạ: hình bên trái, đáp án bên phải, cả hai cao hết sân khấu. Không có hình: đáp án chiếm cả sân khấu.
  if (step.visual && !(revealed && tight)) {
    return (
      <Stage head={head} layout="split" footer={footer}>
        <div className="host-visual">
          <QuestionVisual visual={step.visual} large fill />
        </div>
        <div className={step.images ? "host-column" : "host-column host-answers-fill"}>
          <Answers step={step} state={revealed ? "reveal" : "waiting"} large dense={compact} />
        </div>
      </Stage>
    );
  }
  return (
    <Stage head={head} footer={footer}>
      <div className={step.images ? "host-column" : "host-column host-answers-fill"}>
        <Answers step={step} state={revealed ? "reveal" : "waiting"} large wide dense={compact} oneRow={tight && !step.images} />
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
  const listRef = useRef<HTMLDivElement>(null);
  const rows = useRowsThatFit(listRef, 8, 2);
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
          <Grid columns={{ mobile: 1, desktop: "minmax(0, 1fr) auto" }} gap="xl" align="center">
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
      <div className="host-scroll" ref={listRef}>
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

/** Đường đua các team: mỗi team một thanh theo màu riêng của team, dài theo điểm so với team dẫn đầu. Chỉ có 2 team thì dùng danh sách. */
function TeamRace({ view }: { view: HostView }) {
  if (view.teams.length < 3) return <TeamStandings teams={view.teams} scoreMode={view.settings.teamScore} />;
  const top = Math.max(1, ...view.teams.map((team) => team.score));
  return (
    <ChartCard title="Đường đua các team" headingLevel={2} icon="icon-trophy-01-solid" description={view.settings.teamScore === "avg" ? "Điểm trung bình mỗi thành viên" : "Tổng điểm của team"}>
      <div className="race" role="list" aria-label="Điểm các team">
        {view.teams.map((team) => (
          <div key={team.id} className="race__row" role="listitem">
            <TeamMark team={team} size="sm" />
            <div className="race__body">
              <div className="race__label">
                <Text as="span" textStyle="Body/Base/Medium" truncate>{`${team.rank}. Team ${team.name}`}</Text>
                <Text as="span" textStyle="Body/Base/Bold" tabularNumbers>
                  {formatPoints(team.score)}
                </Text>
              </div>
              <div className="race__track" aria-hidden="true">
                <span className="race__fill" data-hue={team.theme} style={{ "--race": Math.max(0.02, team.score / top) } as CSSProperties} />
              </div>
            </div>
          </div>
        ))}
      </div>
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
        <>
          <Confetti />
          <ActionBar
            direction="horizontal"
            summary={summaryText("Cảm ơn cả lớp! Hẹn gặp ở buổi học đầu tiên.")}
            secondaryAction={{ label: "Tạo phòng mới", onClick: () => navigate("/host") }}
            primaryAction={{ label: "Chơi lại với lớp này", onClick: () => act("restart") }}
          />
        </>
      }
    >
      <div className="host-podium">
        <Podium entries={rankEntries(view.players.slice(0, 3), view.teams)} size="lg" label="Top 3 chung cuộc" />
      </div>
      {side && <BoardSide view={view} />}
    </Stage>
  );
}
