import { Heading, List, ListBox, ListItem, Stack, Text } from "@zen-ds/react";
import type { TeamPreset } from "../../shared/games.js";
import { formatPoints } from "../lib/format";
import type { PlayerSummary, TeamStanding } from "../lib/types";
import { PlayerAvatar, TeamMark, medal } from "./common";

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
              title={`${medal(team.rank, team.score) ?? `${team.rank}.`} ${team.name}${mine}`}
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
              title={`${medal(player.rank, scoreOf(player)) ?? `${player.rank}.`} ${player.name}`}
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
