import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Stack, Text } from "@zen-ds/react";
import { MEMORY_PAIRS, memoryDeck } from "../../shared/games.js";
import { Emoji } from "../components/Fun";
import { formatPoints } from "../lib/format";
import { request } from "../lib/socket";
import type { ChallengeState } from "../lib/types";

interface MoveResult {
  ok?: boolean;
  bonus?: number;
  state?: ChallengeState;
}

const CLOSE_AFTER_MS = 800;

/** Lật hình ghép đôi: lật 2 thẻ, giống nhau thì giữ. Server kiểm tra từng cặp theo seed. */
export function MemoryGame({ stepId, seed, server, running }: { stepId: string; seed: string; server: ChallengeState | null; running: boolean }) {
  const deck = useMemo(() => memoryDeck(seed), [seed]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>(server?.matched ?? []);
  const [score, setScore] = useState(server?.score ?? 0);
  const [bonus, setBonus] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (server?.matched && server.matched.length > matched.length) setMatched(server.matched);
    if (server && server.score > score) setScore(server.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server?.matched?.length, server?.score]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const done = matched.length >= MEMORY_PAIRS * 2;

  const flip = (index: number) => {
    if (!running || done || matched.includes(index) || open.includes(index) || open.length >= 2) return;
    const next = [...open, index];
    setOpen(next);
    if (next.length < 2) return;
    const [a, b] = next;
    if (deck[a] === deck[b]) {
      setMatched((current) => [...current, a, b]);
      timer.current = window.setTimeout(() => setOpen([]), 250);
      void request<MoveResult>("player:move", { stepId, move: { a, b } }).then((result) => {
        if (result.state) {
          setScore(result.state.score);
          setMatched((current) => (result.state!.matched.length > current.length ? result.state!.matched : current));
        }
        if (result.bonus) setBonus(result.bonus);
      });
    } else {
      timer.current = window.setTimeout(() => setOpen([]), CLOSE_AFTER_MS);
    }
  };

  return (
    <Stack gap="md">
      <Stack direction="row" justify="between" align="center">
        <Badge theme="violet" background="subtle" leadingIcon={false}>{`${matched.length / 2}/${MEMORY_PAIRS} cặp`}</Badge>
        <Text as="span" textStyle="Heading/4" tabularNumbers>{`${formatPoints(score)} điểm`}</Text>
      </Stack>
      {/* zen-allow-raw-button: thẻ bài của trò chơi, lật bằng hiệu ứng riêng */}
      <div className="memory-grid" role="group" aria-label="Các thẻ bài, chạm để lật">
        {deck.map((emoji, index) => {
          const shown = open.includes(index) || matched.includes(index);
          return (
            <button
              key={index}
              type="button"
              className="memory-card"
              data-open={shown ? "true" : undefined}
              data-matched={matched.includes(index) ? "true" : undefined}
              aria-label={shown ? `Thẻ ${index + 1}: ${emoji}` : `Thẻ ${index + 1}, úp`}
              disabled={!running}
              onClick={() => flip(index)}
            >
              <span className="memory-card__inner">
                <span className="memory-card__face memory-card__back" aria-hidden="true">
                  ?
                </span>
                <span className="memory-card__face memory-card__front" aria-hidden="true">
                  <Emoji>{emoji}</Emoji>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <Text tone="base" align="center" role="status">
        {done ? `Xong hết ${MEMORY_PAIRS} cặp!${bonus ? ` Thưởng thêm ${formatPoints(bonus)} điểm vì xong sớm.` : ""}` : "Chạm 2 thẻ để lật. Giống nhau thì được giữ lại."}
      </Text>
    </Stack>
  );
}
