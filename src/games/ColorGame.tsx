import { useEffect, useMemo, useState } from "react";
import { Badge, InlineMessage, Stack, Text } from "@zen-ds/react";
import { COLOR_MISS_LOCK_MS, colorLevel } from "../../shared/games.js";
import { serverNow } from "../lib/clock";
import { formatPoints } from "../lib/format";
import { request } from "../lib/socket";
import type { ChallengeState } from "../lib/types";

interface MoveResult {
  ok?: boolean;
  error?: string;
  state?: ChallengeState;
}

/** Mắt thần màu sắc: chạm vào ô khác màu. Màn chơi sinh từ seed nên server kiểm tra được từng lần chạm. */
export function ColorGame({ stepId, seed, server, running }: { stepId: string; seed: string; server: ChallengeState | null; running: boolean }) {
  const [level, setLevel] = useState(server?.level ?? 0);
  const [score, setScore] = useState(server?.score ?? 0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [missed, setMissed] = useState<number | null>(null);
  const [now, setNow] = useState(serverNow);

  // Đồng bộ lại khi server có số liệu mới hơn (vd. vừa vào lại phòng).
  useEffect(() => {
    if (!server) return;
    if (server.level > level) setLevel(server.level);
    if (server.score > score) setScore(server.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server?.level, server?.score]);

  const locked = now < lockedUntil;
  useEffect(() => {
    if (!locked) return;
    const id = window.setTimeout(() => setNow(serverNow()), Math.max(0, lockedUntil - serverNow()) + 20);
    return () => window.clearTimeout(id);
  }, [locked, lockedUntil]);

  const puzzle = useMemo(() => colorLevel(seed, level), [seed, level]);

  const tap = (index: number) => {
    if (!running || locked) return;
    const current = level;
    if (index === puzzle.odd) {
      setLevel(current + 1);
      setScore((value) => value + 50);
      setMissed(null);
    } else {
      const until = serverNow() + COLOR_MISS_LOCK_MS;
      setLockedUntil(until);
      setNow(serverNow());
      setMissed(index);
    }
    void request<MoveResult>("player:move", { stepId, move: { level: current, index } }).then((result) => {
      if (result.state) {
        setLevel((value) => Math.max(value, result.state!.level));
        setScore(result.state.score);
      }
    });
  };

  const cells = puzzle.size * puzzle.size;

  return (
    <Stack gap="md">
      <Stack direction="row" justify="between" align="center">
        <Badge theme="violet" background="subtle" leadingIcon={false}>{`Cấp ${level + 1}`}</Badge>
        <Text as="span" textStyle="Heading/4" tabularNumbers>{`${formatPoints(score)} điểm`}</Text>
      </Stack>
      {/* zen-allow-raw-button: mỗi ô là một ô màu sinh ngẫu nhiên của trò chơi, không phải nút giao diện */}
      <div className="color-grid" style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }} role="group" aria-label={`Lưới ${puzzle.size} × ${puzzle.size} ô màu, chọn ô khác màu`}>
        {Array.from({ length: cells }, (_, index) => (
          <button
            key={`${level}-${index}`}
            type="button"
            className="color-tile"
            data-missed={missed === index && locked ? "true" : undefined}
            style={{ background: index === puzzle.odd ? puzzle.oddColor : puzzle.base }}
            aria-label={`Ô ${index + 1}`}
            disabled={!running}
            onClick={() => tap(index)}
          />
        ))}
      </div>
      {locked && (
        <InlineMessage theme="warning" title="Chưa đúng rồi">
          Đợi 1 giây rồi chạm lại nhé.
        </InlineMessage>
      )}
    </Stack>
  );
}
