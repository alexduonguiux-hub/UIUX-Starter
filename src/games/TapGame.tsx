import { useEffect, useRef, useState } from "react";
import { Badge, Box, Shape, Stack, Text } from "@zen-ds/react";
import { TAP_POINTS } from "../../shared/games.js";
import { EmojiArt } from "../components/Fun";
import { formatPoints } from "../lib/format";
import { request } from "../lib/socket";
import type { ChallengeState } from "../lib/types";

const FLUSH_MS = 250;

/** Đua bấm: bấm thật nhiều trong 10 giây. Gom số lần bấm gửi lên server mỗi 1/4 giây; server chặn tốc độ bất thường. */
export function TapGame({ stepId, server, running }: { stepId: string; server: ChallengeState | null; running: boolean }) {
  const [count, setCount] = useState(server?.taps ?? 0);
  const [hit, setHit] = useState(false);
  const pending = useRef(0);
  const hitTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (server && server.taps > count) setCount(server.taps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [server?.taps]);

  useEffect(() => {
    const flush = () => {
      const taps = pending.current;
      if (!taps) return;
      pending.current = 0;
      void request("player:move", { stepId, move: { taps } });
    };
    const id = window.setInterval(flush, FLUSH_MS);
    return () => {
      window.clearInterval(id);
      flush();
    };
  }, [stepId]);

  useEffect(() => () => window.clearTimeout(hitTimer.current), []);

  const tap = () => {
    if (!running) return;
    pending.current += 1;
    setCount((value) => value + 1);
    setHit(true);
    window.clearTimeout(hitTimer.current);
    hitTimer.current = window.setTimeout(() => setHit(false), 80);
  };

  return (
    <Stack gap="md">
      <Stack direction="row" justify="between" align="center">
        <Badge theme="cyan" background="subtle" leadingIcon={false}>
          {running ? "Bấm liên tục!" : "Hết giờ"}
        </Badge>
        <Text as="span" textStyle="Heading/4" tabularNumbers>{`${formatPoints(count * TAP_POINTS)} điểm`}</Text>
      </Stack>
      {/* zen-allow-box-border: cả khung tròn là nút bấm của trò chơi */}
      <Box
        className="tap-pad"
        data-hit={hit ? "true" : undefined}
        radius="full"
        clip
        role="button"
        tabIndex={0}
        aria-label={`Bấm thật nhanh, đã bấm ${count} lần`}
        aria-disabled={!running}
        onPointerDown={(event) => {
          event.preventDefault();
          tap();
        }}
        onKeyDown={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            tap();
          }
        }}
      >
        <Shape position="absolute" constraintX="left-right" constraintY="top-bottom" type="rectangle" fill={running ? "support-cyan-solid" : "neutral-subtle"} />
        <Stack position="absolute" constraintX="left-right" constraintY="center" gap="2xs" align="center">
          <EmojiArt size="lg">👆</EmojiArt>
          <Text as="span" textStyle="Display-Extra/1" tone={running ? "on-brights" : "strongest"} tabularNumbers align="center">
            {count}
          </Text>
          <Text as="span" textStyle="Heading/3" tone={running ? "on-brights" : "base"} align="center">
            {running ? "BẤM!" : "lần bấm"}
          </Text>
        </Stack>
      </Box>
      <Text tone="base" align="center" role="status">
        {running ? "Mỗi lần bấm 10 điểm. Cả team cộng dồn!" : "Nhìn lên màn hình chiếu xem team nào bấm nhiều nhất."}
      </Text>
    </Stack>
  );
}
