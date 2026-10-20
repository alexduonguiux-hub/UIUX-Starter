import { Avatar, Badge, Box, DockIcon, Image, ProgressBar, Stack, Text, type DockIconProps } from "@zen-ds/react";
import { GAMES, type GameId, type TeamPreset } from "../../shared/games.js";
import { useServerNow } from "../lib/clock";
import { initials, secondsLeft, svgUrl } from "../lib/format";
import type { StepVisual } from "../lib/types";
import { EmojiArt } from "./Fun";

/** Biểu tượng của một trò chơi (emoji trên ô tròn). */
export function GameMark({ game, size = "md" }: { game: GameId; size?: DockIconProps["size"] }) {
  return <DockIcon theme="emoji" emoji={GAMES[game].emoji} size={size} label={GAMES[game].title} />;
}

/** Biểu tượng của một team: ô tròn đặc theo màu của team. */
export function TeamMark({ team, size = "md" }: { team: TeamPreset; size?: DockIconProps["size"] }) {
  return <DockIcon icon={team.icon} theme={team.theme} size={size} label={`Team ${team.name}`} />;
}

/** Nhãn "⚡ Quiz nhanh UI/UX · Câu 2/5" theo màu của trò chơi. */
export function GameBadge({ game, children }: { game: GameId; children?: string }) {
  return (
    <Badge theme={GAMES[game].theme} background="subtle" leadingIcon={false}>
      {children ?? `${GAMES[game].emoji} ${GAMES[game].title}`}
    </Badge>
  );
}

/** Nhãn "Team Pixel" theo màu của team. */
export function TeamBadge({ team, size = "md" }: { team: TeamPreset; size?: "sm" | "md" }) {
  return (
    <Badge theme={team.theme} background="subtle" size={size} leading={team.icon}>
      {`Team ${team.name}`}
    </Badge>
  );
}

/** Ảnh đại diện: emoji học viên chọn (hoặc chữ cái đầu), nền theo màu team. Tên hiện ngay bên cạnh nên avatar là trang trí. */
export function PlayerAvatar({ name, avatar, team, size = "md" }: { name: string; avatar?: string | null; team?: TeamPreset | null; size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" }) {
  return (
    <Avatar size={size} theme={team?.theme ?? "indigo"} background="subtle" alt="">
      {avatar ? <span className="avatar-emoji">{avatar}</span> : initials(name)}
    </Avatar>
  );
}

/** Đồng hồ: số giây còn lại và thanh thời gian đã trôi qua. */
export function Timer({ startsAt, endsAt, size = "md" }: { startsAt: number | null; endsAt: number | null; size?: "md" | "lg" }) {
  const now = useServerNow(200);
  const left = secondsLeft(endsAt, now);
  const total = startsAt && endsAt ? endsAt - startsAt : 1;
  const elapsed = startsAt && endsAt ? Math.min(100, Math.max(0, ((now - startsAt) / total) * 100)) : 0;
  return (
    <Stack gap="2xs" width="fill">
      <Stack direction="row" justify="between" align="baseline">
        <Text as="span" textStyle={size === "lg" ? "Heading/4" : "Body/Base/Medium"} tone="base">
          Thời gian
        </Text>
        <Text as="span" textStyle={size === "lg" ? "Display/3" : "Heading/3"} tabularNumbers tone={left <= 5 ? "negative-base" : "strongest"} role="timer" aria-live="off">
          {`${left} giây`}
        </Text>
      </Stack>
      <ProgressBar value={elapsed} theme="accent" aria-label="Thời gian đã trôi qua" />
    </Stack>
  );
}

/** Hình minh hoạ của câu hỏi: ô màu, hình vẽ, chuỗi emoji hoặc trích dẫn. */
export function QuestionVisual({ visual, large = false }: { visual: StepVisual; large?: boolean }) {
  if (visual.type === "emoji") {
    return (
      <Box surface="surface" radius="2xl" padding={large ? "2xl" : "xl"} width="fill">
        <Stack gap="md" align="center">
          <Badge theme="orange" background="subtle" leadingIcon={false}>
            {visual.caption}
          </Badge>
          <EmojiArt size={large ? "xl" : "lg"} float label={`Câu đố bằng emoji: ${visual.text}`}>
            {visual.text}
          </EmojiArt>
        </Stack>
      </Box>
    );
  }
  if (visual.type === "quote") {
    return (
      <Box surface="surface" radius="2xl" padding={large ? "2xl" : "xl"} width="fill">
        <Stack gap="sm">
          <Text as="span" textStyle="Display/1" tone="accent-base" aria-hidden="true">
            “
          </Text>
          <Text textStyle={large ? "Display/4" : "Heading/3"}>{visual.text}</Text>
          <Text textStyle={large ? "Heading/4" : "Body/Extra/Medium"} tone="base" align="end">
            — Ai đây nhỉ? 🤔
          </Text>
        </Stack>
      </Box>
    );
  }
  if (visual.type === "swatch") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" rx="16" fill="${visual.color}"/></svg>`;
    return <Image src={svgUrl(svg)} alt="Ô màu cần đoán mã" ratio={16 / 9} fit="contain" radius="xl" loading="eager" />;
  }
  return <Image src={svgUrl(visual.svg)} alt={visual.alt} ratio={16 / 9} fit="contain" radius="xl" loading="eager" />;
}

/** Dòng tóm tắt của ActionBar trong kiểu chữ Zen (chuỗi rỗng thì không hiện). */
export const summaryText = (text: string | undefined) => (text ? <Text as="span" textStyle="Body/Base/Regular">{text}</Text> : undefined);

/** Vị trí 1‑3 có huy chương (chỉ khi đã có điểm, để 0 điểm không ai được huy chương). */
export const medal = (rank: number, score = 1) => (score <= 0 ? null : rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null);
