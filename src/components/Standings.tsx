import { Heading, Icon, List, ListBox, ListItem, Stack, Text, VisuallyHidden } from "@zen-ds/react";
import type { TeamPreset } from "../../shared/games.js";
import { formatPoints } from "../lib/format";
import type { PlayerSummary, TeamStanding } from "../lib/types";
import { AvatarTile, PlayerAvatar, Ranked, TeamMark } from "./common";
import { Emoji } from "./Fun";

const memberLabel = (count: number) => `${count} thành viên`;

/** Bảng xếp hạng team. */
export function TeamStandings({
  teams,
  scoreMode,
  highlightId,
  headingLevel = 2,
  theme = "flat",
  roster = false,
}: {
  teams: TeamStanding[];
  scoreMode: "avg" | "sum";
  highlightId?: string | null;
  headingLevel?: 2 | 3;
  theme?: "flat" | "border";
  /** Phòng chờ: chỉ liệt kê team và số thành viên, chưa có điểm. */
  roster?: boolean;
}) {
  const title = roster ? "Các team" : "Xếp hạng team";
  return (
    <ListBox
      theme={theme}
      header={
        <Stack gap="2xs">
          <Heading level={headingLevel} textStyle="Heading/Subheading">
            {title}
          </Heading>
          <Text textStyle="Caption/Regular" tone="base">
            {roster ? "Điểm team được tính khi trò chơi bắt đầu" : scoreMode === "avg" ? "Tính theo điểm trung bình mỗi thành viên" : "Tính theo tổng điểm của team"}
          </Text>
        </Stack>
      }
    >
      <List aria-label={title}>
        {teams.map((team) => {
          const mine = team.id === highlightId ? " · team bạn" : "";
          if (roster) return <ListItem key={team.id} leading={<TeamMark team={team} size="sm" />} title={`Team ${team.name}${mine}`} caption={memberLabel(team.members)} />;
          return (
            <ListItem
              key={team.id}
              leading={<TeamMark team={team} size="sm" />}
              title={
                <Ranked rank={team.rank} score={team.score}>
                  {`${team.name}${mine}`}
                </Ranked>
              }
              caption={scoreMode === "avg" ? `${memberLabel(team.members)} · tổng ${formatPoints(team.sum)}` : `${memberLabel(team.members)} · TB ${formatPoints(team.avg)}`}
              value={formatPoints(team.score)}
              valueCaption={scoreMode === "avg" ? "điểm TB" : "điểm"}
            />
          );
        })}
      </List>
    </ListBox>
  );
}

/** Bảng xếp hạng cá nhân. */
export function PlayerStandings({
  players,
  teams,
  meId,
  title = "Xếp hạng cá nhân",
  caption,
  headingLevel = 2,
  theme = "flat",
  scoreOf = (player) => player.score,
}: {
  players: PlayerSummary[];
  teams: TeamPreset[];
  meId?: string;
  title?: string;
  caption?: string;
  headingLevel?: 2 | 3;
  theme?: "flat" | "border";
  scoreOf?: (player: PlayerSummary) => number;
}) {
  const teamOf = (id: string | null) => teams.find((team) => team.id === id) ?? null;
  return (
    <ListBox
      theme={theme}
      header={
        <Stack gap="2xs">
          <Heading level={headingLevel} textStyle="Heading/Subheading">
            {title}
          </Heading>
          {caption && (
            <Text textStyle="Caption/Regular" tone="base">
              {caption}
            </Text>
          )}
        </Stack>
      }
    >
      <List aria-label={title}>
        {players.map((player) => {
          const team = teamOf(player.teamId);
          const notes = [player.id === meId ? "Bạn" : null, team ? `Team ${team.name}` : null, player.connected ? null : "mất kết nối"].filter(Boolean);
          return (
            <ListItem
              key={player.id}
              leading={<PlayerAvatar name={player.name} avatar={player.avatar} team={team} />}
              title={
                <Ranked rank={player.rank} score={scoreOf(player)}>
                  {player.name}
                </Ranked>
              }
              caption={notes.length ? notes.join(" · ") : undefined}
              value={formatPoints(scoreOf(player))}
              valueCaption="điểm"
            />
          );
        })}
      </List>
    </ListBox>
  );
}

/* ── Bục nhận giải và bảng hạng ─────────────────────── */

export interface RankEntry {
  id: string;
  name: string;
  avatar?: string | null;
  score: number;
  rank: number;
  /** Dòng phụ: team, "Bạn"… */
  caption?: string | null;
}

/** Ba màu của bục: vàng (hạng 1), xanh dừa cạn (hạng 2), cam đào (hạng 3). Vàng và xanh dừa cạn gần như bù nhau, cam đào kề vàng. */
const PLACE_TONE = { 1: "support-yellow-strongest", 2: "support-indigo-strongest", 3: "support-orange-strongest" } as const;

/** Điểm kèm ngôi sao 3D. */
function Score({ value, large = false }: { value: number; large?: boolean }) {
  return (
    <Text as="span" textStyle={large ? "Heading/4" : "Body/Base/Medium"} tone="base" tabularNumbers>
      <Emoji>⭐</Emoji> {formatPoints(value)}
    </Text>
  );
}

/** Bục nhận giải top 3: hạng 2 · hạng 1 · hạng 3, avatar ô trắng phía trên mỗi bậc, tia sáng phía sau. */
export function Podium({ entries, size = "md", label = "Top 3" }: { entries: RankEntry[]; size?: "md" | "lg"; label?: string }) {
  const top = entries.slice(0, 3);
  const order = ([[top[1], 2], [top[0], 1], [top[2], 3]] as const).filter(([entry]) => entry) as Array<[RankEntry, 1 | 2 | 3]>;
  if (!order.length) return null;
  const large = size === "lg";
  return (
    <div className={`podium podium--${size}`} style={{ gridTemplateColumns: `repeat(${order.length}, minmax(0, 1fr))` }} role="list" aria-label={label}>
      <div className="podium__rays" aria-hidden="true" />
      {order.map(([entry, place]) => (
        <div key={entry.id} className="podium__col" data-place={place} role="listitem">
          <div className="podium__who">
            <AvatarTile name={entry.name} avatar={entry.avatar} size={large ? (place === 1 ? "xl" : "lg") : place === 1 ? "lg" : "md"} />
            <Text textStyle={large ? "Heading/4" : "Body/Base/Bold"} align="center" truncate={2} width="fill">
              {entry.name}
            </Text>
            <Score value={entry.score} large={large} />
            {entry.caption && (
              <Text className="podium__caption" textStyle={large ? "Body/Base/Regular" : "Caption/Regular"} tone={large ? "base" : "light"} align="center" truncate width="fill">
                {entry.caption}
              </Text>
            )}
          </div>
          <div className="podium__block">
            <Text as="span" textStyle={large ? "Body/Base/Bold" : "Caption/Bold"} tone={PLACE_TONE[place]} aria-hidden="true">
              ✦ ✦ ✦
            </Text>
            <Text as="span" textStyle={large && place === 1 ? "Display-Extra/1" : "Display/1"} tone={PLACE_TONE[place]} tabularNumbers aria-hidden="true">
              {entry.rank}
            </Text>
            <VisuallyHidden>{`Hạng ${entry.rank}`}</VisuallyHidden>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Các hạng tiếp theo: số hạng kèm cúp, avatar ô trắng, tên, dòng phụ và điểm. ListBox lo phần lề hai bên của các dòng. */
export function RankList({ entries, label, meId, large = false }: { entries: RankEntry[]; label: string; meId?: string; large?: boolean }) {
  if (!entries.length) return null;
  return (
    <ListBox theme="flat">
      <List aria-label={label}>
        {entries.map((entry) => (
          <ListItem
            key={entry.id}
            leading={
              <Stack direction="row" gap="sm" align="center">
                <Stack direction="row" gap="2xs" align="center" width={large ? 56 : 44}>
                  <Icon name="icon-trophy-01-line" size="sm" tone="light" decorative />
                  <Text as="span" textStyle={large ? "Heading/4" : "Body/Base/Bold"} tabularNumbers>
                    {entry.rank}
                  </Text>
                </Stack>
                <AvatarTile name={entry.name} avatar={entry.avatar} size={large ? "md" : "sm"} />
              </Stack>
            }
            title={entry.id === meId ? `${entry.name} · Bạn` : entry.name}
            caption={entry.caption ?? undefined}
            value={<Score value={entry.score} large={large} />}
            selected={entry.id === meId}
          />
        ))}
      </List>
    </ListBox>
  );
}

/** Dữ liệu bảng hạng từ danh sách học viên: dòng phụ là team (và "mất kết nối" nếu có). */
export function rankEntries(players: PlayerSummary[], teams: TeamPreset[], scoreOf: (player: PlayerSummary) => number = (player) => player.score): RankEntry[] {
  return players.map((player) => {
    const team = teams.find((t) => t.id === player.teamId) ?? null;
    const caption = [team ? `Team ${team.name}` : null, player.connected ? null : "mất kết nối"].filter(Boolean).join(" · ");
    return { id: player.id, name: player.name, avatar: player.avatar, score: scoreOf(player), rank: player.rank, caption: caption || null };
  });
}
