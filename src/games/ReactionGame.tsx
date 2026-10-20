import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Box, InlineMessage, Shape, Stack, Text } from "@zen-ds/react";
import { REACTION_ROUNDS, reactionDelays } from "../../shared/games.js";
import { formatPoints } from "../lib/format";
import { request } from "../lib/socket";
import type { ChallengeState } from "../lib/types";
import { EmojiArt } from "../components/Fun";

interface MoveResult {
  ok?: boolean;
  points?: number;
  state?: ChallengeState;
}

type Phase = "wait" | "go" | "early" | "result" | "done";

const FEEDBACK_MS = 1300;

/** Phản xạ nhanh: chờ khung đỏ chuyển xanh rồi chạm. Thời gian đo trên máy học viên, server chấm điểm. */
export function ReactionGame({ stepId, seed, server, running }: { stepId: string; seed: string; server: ChallengeState | null; running: boolean }) {
  const delays = useMemo(() => reactionDelays(seed), [seed]);
  const [round, setRound] = useState(server?.round ?? 0);
  const [phase, setPhase] = useState<Phase>((server?.round ?? 0) >= REACTION_ROUNDS ? "done" : "wait");
  const [score, setScore] = useState(server?.score ?? 0);
  const [best, setBest] = useState<number | null>(server?.best ?? null);
  const [last, setLast] = useState<{ ms: number; points: number } | null>(null);
  const goAt = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  // Mỗi lượt: chờ một khoảng ngẫu nhiên (theo seed) rồi chuyển xanh.
  useEffect(() => {
    if (!running || phase !== "wait" || round >= REACTION_ROUNDS) return;
    timer.current = window.setTimeout(() => {
      goAt.current = performance.now();
      setPhase("go");
    }, delays[round]);
    return () => window.clearTimeout(timer.current);
  }, [running, phase, round, delays]);

  // Sau phản hồi thì sang lượt tiếp theo.
  useEffect(() => {
    if (phase !== "early" && phase !== "result") return;
    const id = window.setTimeout(() => {
      setRound((value) => value + 1);
      setPhase(round + 1 >= REACTION_ROUNDS ? "done" : "wait");
    }, FEEDBACK_MS);
    return () => window.clearTimeout(id);
  }, [phase, round]);

  const send = (move: { round: number; ms?: number; early?: boolean }) =>
    void request<MoveResult>("player:move", { stepId, move }).then((result) => {
      if (result.state) {
        setScore(result.state.score);
        setBest(result.state.best);
      }
    });

  const tap = useCallback(() => {
    if (!running) return;
    if (phase === "wait") {
      window.clearTimeout(timer.current);
      setPhase("early");
      setLast({ ms: 0, points: 0 });
      send({ round, early: true });
    } else if (phase === "go") {
      const ms = Math.round(performance.now() - goAt.current);
      setPhase("result");
      setLast({ ms, points: 0 });
      void request<MoveResult>("player:move", { stepId, move: { round, ms } }).then((result) => {
        if (result.state) {
          setScore(result.state.score);
          setBest(result.state.best);
        }
        setLast({ ms, points: result.points ?? 0 });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, round, stepId]);

  const fill = phase === "go" ? "positive-solid" : phase === "wait" ? "negative-solid" : phase === "early" ? "warning-solid" : "info-solid";
  // Nền vàng "Sớm quá" cần chữ tối: chữ trắng trên vàng chỉ đạt 1.71:1.
  const onBright = phase === "early";
  const big = phase === "go" ? "👆" : phase === "wait" ? "✋" : phase === "early" ? "😅" : phase === "done" ? "🏁" : "⚡";
  const title =
    phase === "go"
      ? "CHẠM NGAY!"
      : phase === "wait"
        ? "Chờ màu xanh…"
        : phase === "early"
          ? "Sớm quá rồi!"
          : phase === "done"
            ? "Xong 5 lượt!"
            : `${last?.ms ?? 0} ms`;
  const caption =
    phase === "result" ? `+${last?.points ?? 0} điểm` : phase === "early" ? "Lượt này 0 điểm" : phase === "done" ? (best ? `Nhanh nhất: ${best} ms` : "Chờ các bạn khác nhé") : null;

  return (
    <Stack gap="md">
      <Stack direction="row" justify="between" align="center">
        <Badge theme="green" background="subtle" leadingIcon={false}>
          {phase === "done" ? `Đã xong ${REACTION_ROUNDS} lượt` : `Lượt ${Math.min(round + 1, REACTION_ROUNDS)}/${REACTION_ROUNDS}`}
        </Badge>
        <Text as="span" textStyle="Heading/4" tabularNumbers>{`${formatPoints(score)} điểm`}</Text>
      </Stack>
      {/* zen-allow-box-border: cả khung là nút bấm của trò chơi */}
      <Box
        className="reaction-pad"
        radius="3xl"
        clip
        role="button"
        tabIndex={0}
        aria-label={phase === "go" ? "Chạm ngay" : "Khung phản xạ, chờ chuyển xanh rồi chạm"}
        onPointerDown={tap}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            tap();
          }
        }}
      >
        <Shape position="absolute" constraintX="left-right" constraintY="top-bottom" type="rectangle" fill={fill} />
        <Stack position="absolute" constraintX="left-right" constraintY="center" gap="xs" align="center">
          <EmojiArt size="xl">{big}</EmojiArt>
          <Text textStyle="Display/3" tone={onBright ? "on-brights" : "on-colors"} align="center" tabularNumbers>
            {title}
          </Text>
          {caption && (
            <Text textStyle="Heading/4" tone={onBright ? "on-brights" : "on-colors"} align="center">
              {caption}
            </Text>
          )}
        </Stack>
      </Box>
      <Text tone="base" align="center" role="status">
        {phase === "done" ? "Nhìn lên màn hình chiếu xem bảng xếp hạng nhé." : "Màn hình đỏ thì chờ. Chuyển xanh thì chạm thật nhanh!"}
      </Text>
      {!running && phase !== "done" && (
        <InlineMessage theme="info" title="Hết giờ!">
          {`Bạn được ${formatPoints(score)} điểm ở lượt này.`}
        </InlineMessage>
      )}
    </Stack>
  );
}
