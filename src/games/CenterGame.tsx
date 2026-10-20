import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Badge, Box, InlineMessage, Shape, Stack, Text } from "@zen-ds/react";
import { CENTER_ROUNDS, centerTargets } from "../../shared/games.js";
import { formatPoints } from "../lib/format";
import { request } from "../lib/socket";
import type { ChallengeState } from "../lib/types";

interface MoveResult {
  ok?: boolean;
  error?: string;
  points?: number;
  distance?: number;
  cx?: number;
  cy?: number;
  state?: ChallengeState;
}

interface Feedback {
  round: number;
  x: number;
  y: number;
  cx: number;
  cy: number;
  points: number;
  distance: number;
}

const MARK = 20;
const TAP = 10;
const FEEDBACK_MS = 1300;

/** Pixel Perfect: chạm vào tâm của từng hình. Toạ độ gửi lên server theo % cạnh khung, server tự chấm điểm. */
export function CenterGame({ stepId, seed, server, running }: { stepId: string; seed: string; server: ChallengeState | null; running: boolean }) {
  const targets = useMemo(() => centerTargets(seed), [seed]);
  const areaRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);
  const [round, setRound] = useState(server?.round ?? 0);
  const [score, setScore] = useState(server?.score ?? 0);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useLayoutEffect(() => {
    const node = areaRef.current;
    if (!node) return;
    const measure = () => setSide(node.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!server) return;
    if (server.round > round && !feedback) setRound(server.round);
    if (server.score > score) setScore(server.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server?.round, server?.score]);

  useEffect(() => {
    if (!feedback) return;
    const id = window.setTimeout(() => {
      setFeedback(null);
      setRound((value) => Math.max(value, feedback.round + 1));
    }, FEEDBACK_MS);
    return () => window.clearTimeout(id);
  }, [feedback]);

  const done = round >= CENTER_ROUNDS && !feedback;
  const shownRound = feedback ? feedback.round : Math.min(round, CENTER_ROUNDS - 1);
  const target = targets[shownRound];
  const px = (percent: number) => (percent / 100) * side;

  const tap = (event: PointerEvent<HTMLDivElement>) => {
    if (!running || pending || feedback || done || !areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const current = round;
    setPending(true);
    void request<MoveResult>("player:move", { stepId, move: { round: current, x, y } }).then((result) => {
      setPending(false);
      if (result.state) setScore(result.state.score);
      if (result.ok && result.cx !== undefined && result.cy !== undefined) {
        setFeedback({ round: current, x, y, cx: result.cx, cy: result.cy, points: result.points ?? 0, distance: result.distance ?? 0 });
      } else if (result.state) {
        setRound(result.state.round);
      }
    });
  };

  return (
    <Stack gap="md">
      <Stack direction="row" justify="between" align="center">
        <Badge theme="green" background="subtle" leadingIcon={false}>{done ? "Đã xong 5 hình" : `Hình ${shownRound + 1}/${CENTER_ROUNDS}`}</Badge>
        <Text as="span" textStyle="Heading/4" tabularNumbers>{`${formatPoints(score)} điểm`}</Text>
      </Stack>

      {/* zen-allow-box-border: cả khung là vùng chạm của trò chơi (onPointerDown), nên dùng viền Subtle như vùng bấm được */}
      <Box
        ref={areaRef}
        className="play-area"
        surface="surface"
        border="subtle"
        radius="xl"
        clip
        role="application"
        aria-label="Khung chơi: chạm vào đúng tâm của hình"
        onPointerDown={tap}
      >
        {side > 0 && target && !done && (
          <Shape
            position="absolute"
            constraintX="left"
            constraintY="top"
            insetLeft={px(target.x)}
            insetTop={px(target.y)}
            width={px(target.w)}
            height={px(target.h)}
            type={target.type === "ellipse" || target.type === "ring" ? "ellipse" : "rectangle"}
            radius={target.type === "rounded" ? "2xl" : undefined}
            arcRatio={target.type === "ring" ? 55 : undefined}
            fill={target.fill}
            label={`Hình ${shownRound + 1}`}
          />
        )}
        {side > 0 && feedback && (
          <>
            <Shape position="absolute" constraintX="left" constraintY="top" insetLeft={px(feedback.cx) - MARK / 2} insetTop={px(feedback.cy) - MARK / 2} width={MARK} height={MARK} type="ellipse" fill="positive-solid" stroke="inverse" strokeWeight={3} strokeAlign="outside" label="Tâm thật" />
            <Shape position="absolute" constraintX="left" constraintY="top" insetLeft={px(feedback.x) - TAP / 2} insetTop={px(feedback.y) - TAP / 2} width={TAP} height={TAP} type="ellipse" fill="neutral-solid" stroke="inverse" strokeWeight={2} strokeAlign="outside" label="Chỗ bạn chạm" />
          </>
        )}
      </Box>

      {feedback ? (
        <InlineMessage theme={feedback.points >= 200 ? "positive" : feedback.points > 0 ? "info" : "warning"} title={`+${feedback.points} điểm`}>
          {`Lệch ${feedback.distance.toLocaleString("vi-VN")}% so với tâm. Chấm xanh là tâm thật, chấm đen là chỗ bạn chạm.`}
        </InlineMessage>
      ) : done ? (
        <InlineMessage theme="positive" title="Bạn đã chạm xong 5 hình">
          Chờ các bạn khác hoàn thành nhé.
        </InlineMessage>
      ) : (
        <Text tone="base" align="center">
          {target?.type === "ring" ? "Hình vòng: tâm nằm ở khoảng trống giữa vòng." : "Chạm một lần vào đúng tâm của hình."}
        </Text>
      )}
    </Stack>
  );
}
