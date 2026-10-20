import { useEffect, useState } from "react";
import {
  ActionBar,
  AlertBanner,
  BadgeCounter,
  BottomSheet,
  Box,
  Button,
  Card,
  EmptyState,
  Form,
  FormFieldset,
  Grid,
  Heading,
  InlineMessage,
  InputField,
  List,
  ListItem,
  MetricCard,
  Stack,
  Text,
  TextAreaField,
  TopNavigation,
  useToast,
} from "@zen-ds/react";
import { AVATARS, FACT_MAX, GAMES, NAME_MAX } from "../../shared/games.js";
import { Answers, optionLetter } from "../components/Answers";
import { GameBadge, GameMark, PlayerAvatar, QuestionVisual, TeamBadge, TeamMark, Timer, medal } from "../components/common";
import { PlayerStandings, TeamStandings } from "../components/Standings";
import { Confetti, EmojiArt, HeroArt } from "../components/Fun";
import { GameTile, RaisedAvatar, SceneBanner } from "../components/Scene";
import { CenterGame } from "../games/CenterGame";
import { ColorGame } from "../games/ColorGame";
import { ReactionGame } from "../games/ReactionGame";
import { syncClock, useServerNow } from "../lib/clock";
import { formatPoints, points } from "../lib/format";
import { navigate } from "../lib/router";
import { request, socket, useConnection, useOnConnect } from "../lib/socket";
import { LAST_NAME_KEY, load, playerKeyFor, remove, save } from "../lib/storage";
import type { PlayerView, RoomPeek } from "../lib/types";

interface StoredPlayer {
  playerId: string;
  name: string;
}

type Status = "checking" | "join" | "playing" | "missing" | "kicked";

/** Màn hình của học viên trên điện thoại. */
export function PlayerRoom({ pin }: { pin: string }) {
  const [stored, setStored] = useState<StoredPlayer | null>(() => load<StoredPlayer>(playerKeyFor(pin)));
  const [status, setStatus] = useState<Status>("checking");
  const [peek, setPeek] = useState<RoomPeek | null>(null);
  const [view, setView] = useState<PlayerView | null>(null);
  const [leaving, setLeaving] = useState(false);
  const connection = useConnection();

  useEffect(() => {
    const onState = (next: PlayerView) => {
      if (next.pin !== pin) return;
      syncClock(next.now);
      setView(next);
    };
    const onKicked = () => {
      remove(playerKeyFor(pin));
      setStored(null);
      setView(null);
      setStatus("kicked");
    };
    socket.on("player:state", onState);
    socket.on("player:kicked", onKicked);
    return () => {
      socket.off("player:state", onState);
      socket.off("player:kicked", onKicked);
    };
  }, [pin]);

  const loadPeek = async () => {
    const result = await request<{ ok?: boolean; room?: RoomPeek }>("room:peek", { pin });
    if (result.ok && result.room) {
      setPeek(result.room);
      setStatus("join");
    } else setStatus("missing");
  };

  useOnConnect(() => {
    if (status === "kicked") return;
    if (!stored) {
      void loadPeek();
      return;
    }
    void request<{ ok?: boolean }>("player:resume", { pin, playerId: stored.playerId }).then((result) => {
      if (result.ok) setStatus("playing");
      else {
        remove(playerKeyFor(pin));
        setStored(null);
        void loadPeek();
      }
    });
  }, [pin, stored?.playerId]);

  const leave = async () => {
    setLeaving(true);
    await request("player:leave");
    remove(playerKeyFor(pin));
    navigate("/");
  };

  const playing = status === "playing" && view;
  const team = playing ? view.teams.find((t) => t.id === view.me.teamId) ?? null : null;

  return (
    <Stack gap="none">
      <TopNavigation
        type="compact-alt"
        sticky
        title={playing ? view.me.name : `Phòng ${pin}`}
        titleLeading={playing ? <PlayerAvatar name={view.me.name} avatar={view.me.avatar} team={team} size="sm" /> : undefined}
        subtitle={playing ? [team ? `Team ${team.name}` : null, points(view.me.score)].filter(Boolean).join(" · ") : undefined}
        banner={connection === "reconnecting" ? <AlertBanner theme="warning" size="sm">Mất kết nối, đang kết nối lại…</AlertBanner> : undefined}
      />
      <Stack gap="xl" padding="margin-comfortable">
        {status === "checking" && <Text tone="base">Đang vào phòng…</Text>}
        {status === "missing" && (
          <EmptyState title={`Không tìm thấy phòng ${pin}`} headingLevel={2} icon="icon-flag-01-line" primaryAction={{ label: "Nhập mã khác", onClick: () => navigate("/") }}>
            Kiểm tra lại mã phòng trên màn hình chiếu nhé.
          </EmptyState>
        )}
        {status === "kicked" && (
          <EmptyState title="Bạn đã được mời ra khỏi phòng" headingLevel={2} icon="icon-user-x-line" primaryAction={{ label: "Vào lại phòng", onClick: () => window.location.reload() }}>
            Nếu có nhầm lẫn, hãy báo giảng viên và vào lại với tên khác.
          </EmptyState>
        )}
        {status === "join" && peek && (
          <JoinForm
            peek={peek}
            onJoined={(player) => {
              save(playerKeyFor(pin), player);
              save(LAST_NAME_KEY, player.name);
              setStored(player);
              setStatus("playing");
            }}
          />
        )}
        {playing && <PlayerPhase view={view} leaving={leaving} onLeave={() => void leave()} />}
      </Stack>
    </Stack>
  );
}

/* ── Vào phòng ──────────────────────────────────────── */

function JoinForm({ peek, onJoined }: { peek: RoomPeek; onJoined: (player: StoredPlayer) => void }) {
  const [name, setName] = useState(() => load<string>(LAST_NAME_KEY) ?? "");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [avatar, setAvatar] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  const [fact, setFact] = useState("");
  const asksFact = peek.games.includes("whois") && peek.phase === "lobby";
  const [error, setError] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const choose = peek.mode === "team" && peek.assign === "choose";

  const submit = async () => {
    if (!name.trim()) {
      setError("Hãy nhập tên để cả lớp biết bạn là ai.");
      return;
    }
    if (choose && !teamId) {
      setTeamError("Chọn một team để vào phòng.");
      return;
    }
    setBusy(true);
    const result = await request<{ ok?: boolean; error?: string; playerId?: string; name?: string }>("player:join", { pin: peek.pin, name, teamId, avatar, fact: asksFact ? fact : undefined });
    setBusy(false);
    if (!result.ok || !result.playerId) {
      setError(result.error ?? "Chưa vào được phòng, thử lại nhé.");
      return;
    }
    onJoined({ playerId: result.playerId, name: result.name ?? name });
  };

  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Card theme="subtle" color="brand">
        <Stack gap="sm" align="center" paddingY="sm">
          <HeroArt main={avatar} bits={["👋", "✨", "🎉", "💬"]} size="md" />
          <Heading level={2} textStyle="Heading/2" align="center">
            Chào bạn!
          </Heading>
          <Text tone="base" align="center">
            Chọn avatar, nhập tên rồi vào phòng chơi cùng cả lớp.
          </Text>
        </Stack>
      </Card>
      {peek.phase !== "lobby" && (
        <InlineMessage theme="info" title="Trò chơi đang diễn ra">
          Bạn vẫn vào được và chơi tiếp từ câu sau.
        </InlineMessage>
      )}
      <InputField
        label="Tên của bạn"
        placeholder="VD: Minh Anh"
        helpText="Tên này hiện trên bảng xếp hạng"
        autoComplete="nickname"
        maxLength={NAME_MAX}
        size="lg"
        value={name}
        error={error ?? undefined}
        onValueChange={(value) => {
          setName(value);
          setError(null);
        }}
      />
      <FormFieldset legend="Chọn avatar">
        <Grid columns={4} gap="xs">
          {AVATARS.map((emoji) => (
            <Card key={emoji} theme="subtle" color="neutral" spacing="sm" selected={avatar === emoji} onClick={() => setAvatar(emoji)} aria-label={`Chọn avatar ${emoji}`}>
              <Stack align="center">
                <EmojiArt size="md">{emoji}</EmojiArt>
              </Stack>
            </Card>
          ))}
        </Grid>
      </FormFieldset>
      {asksFact && (
        <TextAreaField
          label="Một điều thú vị về bạn"
          labelOptional
          placeholder="VD: Mình từng đi phượt Hà Giang bằng xe đạp"
          helpText="Cả lớp sẽ đoán xem ai viết điều này trong trò “Ai là ai?”."
          maxLength={FACT_MAX}
          characterLimit
          value={fact}
          onValueChange={setFact}
        />
      )}
      {choose && (
        <FormFieldset legend="Chọn team" error={teamError ?? undefined}>
          <Grid columns={2} gap="sm">
            {peek.teams.map((team) => (
              <Card
                key={team.id}
                theme="subtle"
                color={team.card}
                spacing="sm"
                selected={teamId === team.id}
                onClick={() => {
                  setTeamId(team.id);
                  setTeamError(null);
                }}
                aria-label={`Team ${team.name}, ${team.members} người`}
              >
                <Stack gap="xs" align="center">
                  <TeamMark team={team} />
                  <Text textStyle="Body/Base/Medium" align="center">{`Team ${team.name}`}</Text>
                  <Text textStyle="Caption/Regular" tone="base" align="center">{`${team.members} người`}</Text>
                </Stack>
              </Card>
            ))}
          </Grid>
        </FormFieldset>
      )}
      {peek.mode === "team" && !choose && (
        <Text textStyle="Body/Small/Regular" tone="base">
          Bạn sẽ được xếp vào một trong các team một cách tự động.
        </Text>
      )}
      <ActionBar primaryAction={{ label: busy ? "Đang vào phòng…" : "Vào phòng", type: "submit", disabled: busy }} />
    </Form>
  );
}

/* ── Các màn chơi ───────────────────────────────────── */

function PlayerPhase({ view, leaving, onLeave }: { view: PlayerView; leaving: boolean; onLeave: () => void }) {
  switch (view.phase) {
    case "lobby":
      return <Lobby view={view} leaving={leaving} onLeave={onLeave} />;
    case "intro":
      return <Intro view={view} />;
    case "question":
      return <Question view={view} />;
    case "reveal":
      return <Reveal view={view} />;
    case "challenge":
      return <Challenge view={view} />;
    case "leaderboard":
      return <Standing view={view} />;
    case "final":
      return <Final view={view} />;
    default:
      return null;
  }
}

function Lobby({ view, leaving, onLeave }: { view: PlayerView; leaving: boolean; onLeave: () => void }) {
  const [sheet, setSheet] = useState(false);
  const [fact, setFact] = useState(view.me.fact);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const asksFact = view.sections.some((section) => section.id === "whois");
  const saveFact = async () => {
    setSaving(true);
    const result = await request("player:profile", { fact });
    setSaving(false);
    toast({ title: result.error ?? (fact.trim() ? "Đã lưu điều thú vị của bạn" : "Đã xoá điều thú vị") });
  };
  const team = view.teams.find((t) => t.id === view.me.teamId) ?? null;
  const canSwitch = view.settings.mode === "team" && view.settings.assign === "choose";
  const others = team ? team.members - 1 : 0;

  const switchTeam = async (teamId: string) => {
    setSheet(false);
    const result = await request("player:team", { teamId });
    if (result.error) toast({ title: result.error });
  };

  return (
    <Stack gap="xl">
      <Stack gap="md">
        <SceneBanner ratio={2.2} />
        <div className="overlap-up pop-in">
          <RaisedAvatar>
            <PlayerAvatar name={view.me.name} avatar={view.me.avatar} team={team} size="3xl" />
          </RaisedAvatar>
        </div>
        <Stack gap="xs" align="center">
          <Heading level={2} textStyle="Heading/1" align="center">{`Chào ${view.me.name}!`}</Heading>
          {team && <TeamBadge team={team} />}
          <Text tone="base" align="center">
            {team ? (others > 0 ? `Bạn ở team ${team.name} cùng ${others} bạn khác.` : `Bạn là người đầu tiên của team ${team.name}.`) : "Bạn chơi cá nhân, cố lên!"}
          </Text>
        </Stack>
        <Grid columns={2} gap="sm">
          <MetricCard type="tile" theme="subtle" color="yellow" label="Người chơi" value={String(view.playerCount)} icon="icon-users-line" iconTheme="yellow" />
          <MetricCard type="tile" theme="subtle" color="violet" label="Phần chơi" value={String(view.sections.length)} icon="icon-flag-01-line" iconTheme="violet" />
        </Grid>
      </Stack>
      <InlineMessage theme="info" title="Đã vào phòng">
        Nhìn lên màn hình chiếu nhé, trò chơi sắp bắt đầu.
      </InlineMessage>
      <Stack gap="md">
        <Heading level={3} textStyle="Heading/4">
          Trò chơi hôm nay
        </Heading>
        <Grid columns={2} gap="sm">
          {view.sections.map((section, index) => (
            <GameTile key={section.id} game={section.id} caption={`Phần ${index + 1}`} />
          ))}
        </Grid>
      </Stack>
      {asksFact && (
        <Card theme="flat">
          <Stack gap="md">
            <Stack direction="row" gap="xs" align="center">
              <EmojiArt size="md">🕵️</EmojiArt>
              <Heading level={3} textStyle="Heading/Subheading" width="fill">
                Điều thú vị về bạn
              </Heading>
            </Stack>
            <TextAreaField
              label="Cả lớp sẽ đoán ai viết điều này"
              placeholder="VD: Mình biết nấu 10 món phở khác nhau"
              maxLength={FACT_MAX}
              characterLimit
              value={fact}
              onValueChange={setFact}
            />
            <Button level="tertiary" size="md" onClick={() => void saveFact()} disabled={saving || fact === view.me.fact}>
              {saving ? "Đang lưu…" : "Lưu điều thú vị"}
            </Button>
          </Stack>
        </Card>
      )}
      {view.settings.mode === "team" && <TeamStandings teams={view.teams} scoreMode={view.settings.teamScore} highlightId={view.me.teamId} roster />}
      <Stack gap="sm">
        {canSwitch && (
          <Button level="tertiary" size="lg" onClick={() => setSheet(true)}>
            Đổi team
          </Button>
        )}
        <Button level="tertiary" size="lg" onClick={onLeave} disabled={leaving}>
          {leaving ? "Đang rời phòng…" : "Rời phòng"}
        </Button>
      </Stack>
      <BottomSheet title="Chọn team" open={sheet} onOpenChange={setSheet}>
        <List aria-label="Các team">
          {view.teams.map((t) => (
            <ListItem
              key={t.id}
              leading={<TeamMark team={t} size="sm" />}
              title={`Team ${t.name}`}
              caption={`${t.members} người`}
              selected={t.id === view.me.teamId}
              onClick={() => void switchTeam(t.id)}
            />
          ))}
        </List>
      </BottomSheet>
    </Stack>
  );
}

function Intro({ view }: { view: PlayerView }) {
  const game = view.step ? GAMES[view.step.game] : null;
  if (!game || !view.step) return null;
  return (
    <Stack gap="lg">
      <Card theme="subtle" color="brand">
        <Stack gap="sm" align="center" paddingY="md">
          <HeroArt main={game.emoji} bits={game.art} size="md" />
          <Text as="span" textStyle="Body/Base/Medium" tone="base">{`Phần ${view.step.section}/${view.sections.length}`}</Text>
          <Heading level={2} textStyle="Heading/1" align="center">
            {game.title}
          </Heading>
          <Text tone="base" align="center">
            {game.short}
          </Text>
        </Stack>
      </Card>
      <Box surface="surface" radius="2xl" padding="xl">
        <Stack gap="md">
          <Heading level={3} textStyle="Heading/Subheading">
            Cách chơi
          </Heading>
          {game.howTo.map((line, index) => (
            <Stack key={line} direction="row" gap="sm" align="start">
              <BadgeCounter value={index + 1} />
              <Text width="fill">{line}</Text>
            </Stack>
          ))}
        </Stack>
      </Box>
      <Text tone="base" align="center">
        Chờ giảng viên bấm bắt đầu…
      </Text>
    </Stack>
  );
}

function QuestionHeader({ view }: { view: PlayerView }) {
  const step = view.step!;
  const game = GAMES[step.game];
  return (
    <Stack gap="md">
      <GameBadge game={game.id}>{`${game.emoji} ${game.title} · Câu ${step.number}/${step.total}`}</GameBadge>
      <Heading level={2} textStyle="Heading/3">
        {step.prompt}
      </Heading>
      {step.visual && <QuestionVisual visual={step.visual} />}
    </Stack>
  );
}

function Question({ view }: { view: PlayerView }) {
  const step = view.step!;
  const [picked, setPicked] = useState<number | null>(null);
  const { toast } = useToast();
  const chosen = view.me.answer ?? picked;
  const now = useServerNow(500);
  const timeUp = view.endsAt !== null && now > view.endsAt;

  useEffect(() => setPicked(null), [step.id]);

  const choose = async (index: number) => {
    if (chosen !== null) return;
    setPicked(index);
    const result = await request("player:answer", { stepId: step.id, choice: index });
    if (result.error) {
      setPicked(null);
      toast({ title: result.error });
    }
  };

  if (view.me.isAuthor) {
    return (
      <Stack gap="lg">
        <Timer startsAt={view.startsAt} endsAt={view.endsAt} />
        <Card theme="subtle" color="violet">
          <Stack gap="sm" align="center" paddingY="md">
            <HeroArt main="🤫" bits={["👀", "❓", "💬", "🕵️"]} size="md" />
            <Heading level={2} textStyle="Heading/2" align="center">
              Đây là điều bạn viết!
            </Heading>
            <Text tone="base" align="center">
              Giữ bí mật nhé. Cả lớp đang đoán xem ai đã viết. Bạn được 300 điểm vì đã chia sẻ.
            </Text>
          </Stack>
        </Card>
        {step.visual && <QuestionVisual visual={step.visual} />}
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Timer startsAt={view.startsAt} endsAt={view.endsAt} />
      <QuestionHeader view={view} />
      <Answers step={step} state={chosen === null && !timeUp ? "answer" : "waiting"} chosen={chosen} onChoose={(index) => void choose(index)} />
      {chosen !== null ? (
        <InlineMessage theme="neutral" title="Đã gửi câu trả lời">
          Chờ mọi người trả lời xong nhé.
        </InlineMessage>
      ) : timeUp ? (
        <InlineMessage theme="warning" title="Hết giờ rồi">
          Chờ công bố đáp án nhé.
        </InlineMessage>
      ) : null}
    </Stack>
  );
}

/** Bốn ô thống kê kiểu game: điểm, hạng, team, chuỗi đúng. */
function MyScore({ view }: { view: PlayerView }) {
  const team = view.teams.find((t) => t.id === view.me.teamId) ?? null;
  return (
    <Grid columns={2} gap="sm">
      <MetricCard type="tile" theme="subtle" color="yellow" label="Tổng điểm" value={formatPoints(view.me.score)} icon="icon-trophy-01-solid" iconTheme="yellow" />
      <MetricCard type="tile" theme="subtle" color="violet" label="Hạng cá nhân" value={`${view.me.rank}/${view.playerCount}`} icon="icon-award-01-solid" iconTheme="violet" />
      {team && view.me.teamRank ? (
        <MetricCard type="tile" theme="subtle" color={team.card} label={`Team ${team.name}`} value={`#${view.me.teamRank}`} icon={team.icon} iconTheme={team.theme} />
      ) : null}
      <MetricCard type="tile" theme="subtle" color="orange" label="Chuỗi đúng" value={`${view.me.streak} 🔥`} icon="icon-zap-solid" iconTheme="orange" />
    </Grid>
  );
}

function Reveal({ view }: { view: PlayerView }) {
  const step = view.step!;
  const last = view.me.last;
  const isPoll = step.game === "poll";
  let message: { theme: "positive" | "negative" | "info" | "warning"; title: string; body: string; emoji: string };
  if (last?.author) message = { theme: "positive", title: `+${last.points} điểm chia sẻ`, body: "Cảm ơn bạn đã kể về mình!", emoji: "🤗" };
  else if (!last?.answered) message = { theme: "warning", title: "Bạn chưa trả lời câu này", body: "Câu sau nhanh tay hơn nhé!", emoji: "⏰" };
  else if (isPoll && last.correct) message = { theme: "positive", title: `Bạn thuộc số đông! +${last.points}`, body: "Nhiều bạn trong lớp cũng thích giống bạn.", emoji: "🙌" };
  else if (isPoll) message = { theme: "info", title: "Bạn thuộc số ít", body: "Khác biệt cũng là điểm thú vị!", emoji: "🦄" };
  else if (last.correct) message = { theme: "positive", title: `Chính xác! +${formatPoints(last.points)}`, body: view.me.streak >= 2 ? `Chuỗi ${view.me.streak} câu đúng liên tiếp 🔥` : "Nhanh và đúng, tuyệt lắm!", emoji: "🎉" };
  else {
    const answer = step.answer ?? 0;
    message = { theme: "negative", title: "Chưa đúng rồi", body: step.images ? `Đáp án đúng là phương án ${optionLetter(answer)}.` : `Đáp án đúng là ${optionLetter(answer)}: ${step.options?.[answer] ?? ""}`, emoji: "😅" };
  }
  const celebrate = Boolean(last?.correct && !isPoll);

  return (
    <Stack gap="lg">
      {celebrate && <Confetti pieces={28} />}
      <Stack align="center">
        <EmojiArt size="xl" float>
          {message.emoji}
        </EmojiArt>
      </Stack>
      <InlineMessage theme={message.theme} title={message.title}>
        {message.body}
      </InlineMessage>
      <MyScore view={view} />
      <QuestionHeader view={view} />
      <Answers step={step} state="reveal" chosen={last?.choice ?? null} />
      {step.explain && (
        <InlineMessage theme="info" title={step.principle ? `Nguyên tắc: ${step.principle}` : "Vì sao?"}>
          {step.explain}
        </InlineMessage>
      )}
    </Stack>
  );
}

function Challenge({ view }: { view: PlayerView }) {
  const step = view.step!;
  const game = GAMES[step.game];
  const now = useServerNow(200);
  const waiting = view.startsAt !== null && now < view.startsAt;
  const over = view.endsAt !== null && now >= view.endsAt;

  return (
    <Stack gap="lg">
      <Stack direction="row" gap="sm" align="center">
        <GameMark game={game.id} size="sm" />
        <Heading level={2} textStyle="Heading/3">
          {game.title}
        </Heading>
      </Stack>
      {waiting ? (
        <Stack gap="md" align="center" paddingY="2xl">
          <Text tone="base">Chuẩn bị…</Text>
          <Text as="span" textStyle="Display-Extra/1" tabularNumbers role="timer">
            {Math.max(1, Math.ceil((view.startsAt! - now) / 1000))}
          </Text>
          <Text tone="base" align="center">
            {game.howTo[0]}
          </Text>
        </Stack>
      ) : (
        <>
          <Timer startsAt={view.startsAt} endsAt={view.endsAt} />
          {over && (
            <InlineMessage theme="info" title="Hết giờ!">
              {`Bạn được ${points(view.me.challenge?.score ?? 0)} ở lượt này.`}
            </InlineMessage>
          )}
          {step.game === "color" ? (
            <ColorGame stepId={step.id} seed={step.seed!} server={view.me.challenge} running={!over} />
          ) : step.game === "reaction" ? (
            <ReactionGame stepId={step.id} seed={step.seed!} server={view.me.challenge} running={!over} />
          ) : (
            <CenterGame stepId={step.id} seed={step.seed!} server={view.me.challenge} running={!over} />
          )}
        </>
      )}
    </Stack>
  );
}

function Standing({ view }: { view: PlayerView }) {
  return (
    <Stack gap="lg">
      <Card theme="subtle" color="brand">
        <Stack gap="2xs" align="center" paddingY="md">
          <Text tone="base">Bạn đang đứng</Text>
          <Heading level={2} textStyle="Display/2" align="center">{`${medal(view.me.rank, view.me.score) ?? ""} Hạng ${view.me.rank}`.trim()}</Heading>
          <Text textStyle="Body/Extra/Medium" tone="base">{`trên ${view.playerCount} người · ${points(view.me.score)}`}</Text>
        </Stack>
      </Card>
      {view.settings.mode === "team" && <TeamStandings teams={view.teams} scoreMode={view.settings.teamScore} highlightId={view.me.teamId} />}
      <PlayerStandings players={view.top} teams={view.teams} meId={view.me.id} title="Top 5" />
      <Text tone="base" align="center">
        Nhìn lên màn hình chiếu, câu tiếp theo sắp tới…
      </Text>
    </Stack>
  );
}

function Final({ view }: { view: PlayerView }) {
  const team = view.teams.find((t) => t.id === view.me.teamId) ?? null;
  const champion = view.settings.mode === "team" ? view.teams[0] : null;
  const celebrate = view.me.rank <= 3 || (team !== null && champion !== null && team.id === champion.id);
  return (
    <Stack gap="lg">
      {celebrate && <Confetti />}
      <Card theme="subtle" color="brand">
        <Stack gap="sm" align="center" paddingY="md">
          <Text as="span" textStyle="Display-Extra/2" aria-hidden="true">
            {medal(view.me.rank, view.me.score) ?? "🎉"}
          </Text>
          <Heading level={2} textStyle="Heading/1" align="center">{`Bạn xếp hạng ${view.me.rank}/${view.playerCount}`}</Heading>
          <Text textStyle="Body/Extra/Medium" tone="base">
            {points(view.me.score)}
          </Text>
        </Stack>
      </Card>
      {team && champion && (
        <InlineMessage theme={team.id === champion.id ? "positive" : "info"} title={team.id === champion.id ? `Team ${team.name} vô địch! 🏆` : `Team ${team.name} đứng hạng ${team.rank}/${view.teams.length}`}>
          {team.id === champion.id ? "Cả team đã chơi rất tốt." : `Team ${champion.name} vô địch lần này.`}
        </InlineMessage>
      )}
      {view.settings.mode === "team" && <TeamStandings teams={view.teams} scoreMode={view.settings.teamScore} highlightId={view.me.teamId} />}
      <PlayerStandings players={view.top} teams={view.teams} meId={view.me.id} title="Top 5 cả lớp" />
      <InlineMessage theme="neutral" title="Hẹn gặp ở buổi học đầu tiên!">
        Cảm ơn bạn đã tham gia khởi động khoá học UI/UX.
      </InlineMessage>
      <Button level="tertiary" size="lg" onClick={() => navigate("/")}>
        Về trang chủ
      </Button>
    </Stack>
  );
}
