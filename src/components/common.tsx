import type { CSSProperties, ReactNode } from "react";
import { Avatar, Badge, Box, DockIcon, Image, ProgressBar, Stack, Text, type DockIconProps } from "@zen-ds/react";
import { GAMES, type GameId, type TeamPreset } from "../../shared/games.js";
import { useServerNow } from "../lib/clock";
import { initials, secondsLeft, svgUrl } from "../lib/format";
import type { StepVisual } from "../lib/types";
import { Emoji, EmojiArt, emojiSrc, splitGraphemes } from "./Fun";

/** Biểu tượng của một trò chơi: emoji 3D trên ô tròn. */
export function GameMark({ game, size = "md" }: { game: GameId; size?: DockIconProps["size"] }) {
  return <DockIcon theme="emoji" emoji={<Emoji>{GAMES[game].emoji}</Emoji>} size={size} label={GAMES[game].title} />;
}

/** Biểu tượng của một team: ô tròn đặc theo màu của team. */
export function TeamMark({ team, size = "md" }: { team: TeamPreset; size?: DockIconProps["size"] }) {
  return <DockIcon icon={team.icon} theme={team.theme} size={size} label={`Team ${team.name}`} />;
}

/** Nhãn "Quiz nhanh UI/UX · Câu 2/5" theo màu của trò chơi, có emoji 3D của trò chơi ở đầu. */
export function GameBadge({ game, children }: { game: GameId; children?: string }) {
  return (
    <Badge theme={GAMES[game].theme} background="subtle" leading={<Emoji>{GAMES[game].emoji}</Emoji>}>
      {children ?? GAMES[game].title}
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

/**
 * Ảnh đại diện. Emoji con vật nằm trên nền trắng (theme "photo") để nổi rõ trên thẻ Subtle có màu.
 * Chưa chọn emoji thì hiện chữ cái đầu trên màu team. Tên hiện ngay bên cạnh nên avatar là trang trí.
 */
export function PlayerAvatar({ name, avatar, team, size = "md" }: { name: string; avatar?: string | null; team?: TeamPreset | null; size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" }) {
  const src = avatar ? emojiSrc(avatar) : null;
  if (avatar) {
    return (
      <Avatar size={size} theme="photo" alt="">
        {src ? <img className="avatar-emoji" src={src} alt="" draggable={false} /> : avatar}
      </Avatar>
    );
  }
  return (
    <Avatar size={size} theme={team?.theme ?? "indigo"} background="subtle" alt="">
      {initials(name)}
    </Avatar>
  );
}

/** Avatar ô vuông bo tròn nền trắng (bục nhận giải, bảng xếp hạng): emoji 3D hoặc chữ cái đầu. Trang trí, tên luôn đi kèm. */
export function AvatarTile({ name, avatar, size = "md" }: { name: string; avatar?: string | null; size?: "sm" | "md" | "lg" | "xl" }) {
  const src = avatar ? emojiSrc(avatar) : null;
  return (
    <span className={`avatar-tile avatar-tile--${size}`} aria-hidden="true">
      {src ? <img src={src} alt="" draggable={false} /> : <Text as="span" textStyle="Body/Base/Bold">{initials(name)}</Text>}
    </span>
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
          {visual.caption && (
            <Badge theme="neutral" background="subtle" leadingIcon={false}>
              {visual.caption}
            </Badge>
          )}
          {/* Câu đố là một chuỗi emoji: luôn một dòng, cỡ hình tự co theo bề ngang khung. */}
          <div className={`emoji-seq${large ? " emoji-seq--large" : ""}`} style={{ "--n": Math.max(1, splitGraphemes(visual.text).filter((part) => part.trim()).length) } as CSSProperties}>
            <EmojiArt size={large ? "xl" : "lg"} float label={`Câu đố bằng emoji: ${visual.text}`}>
              {visual.text}
            </EmojiArt>
          </div>
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
            — Ai đây nhỉ? <Emoji>🤔</Emoji>
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

/** Tên kèm huy chương 3D (hạng 1‑3) hoặc số hạng, dùng làm tiêu đề dòng trong bảng xếp hạng. */
export function Ranked({ rank, score = 1, children }: { rank: number; score?: number; children: ReactNode }) {
  const icon = medal(rank, score);
  return (
    <>
      {icon ? <Emoji label={`Hạng ${rank}`}>{icon}</Emoji> : `${rank}.`} {children}
    </>
  );
}
