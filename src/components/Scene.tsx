import type { ReactNode } from "react";
import { Box, Card, Image, Stack, Text } from "@zen-ds/react";
import { GAMES, type GameId } from "../../shared/games.js";
import { svgUrl } from "../lib/format";
import { EmojiArt } from "./Fun";

/** Tranh nền trang trí: bầu trời pastel, hành tinh, sao và đồi. Màu nằm trong hình, không phải giao diện. */
const SCENE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9A7FF"/><stop offset="0.6" stop-color="#F3A6D8"/><stop offset="1" stop-color="#FFC9A8"/></linearGradient>
<linearGradient id="planet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3B3"/><stop offset="1" stop-color="#FF9F7A"/></linearGradient>
<linearGradient id="moon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D7F0FF"/><stop offset="1" stop-color="#8EC5FF"/></linearGradient>
<linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C86F5"/><stop offset="1" stop-color="#7A62E8"/></linearGradient>
<linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4A3FF"/><stop offset="1" stop-color="#A88BF7"/></linearGradient>
</defs>
<rect width="400" height="200" fill="url(#sky)"/>
<g fill="#ffffff"><circle cx="40" cy="30" r="1.6" opacity=".9"/><circle cx="92" cy="58" r="1.2" opacity=".7"/><circle cx="150" cy="22" r="1.8" opacity=".9"/><circle cx="214" cy="48" r="1.1" opacity=".7"/><circle cx="262" cy="18" r="1.4" opacity=".8"/><circle cx="372" cy="70" r="1.3" opacity=".7"/><circle cx="20" cy="84" r="1" opacity=".6"/><circle cx="120" cy="96" r="1.2" opacity=".5"/></g>
<circle cx="318" cy="64" r="40" fill="url(#planet)"/>
<ellipse cx="318" cy="66" rx="62" ry="10" fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="3" transform="rotate(-14 318 66)"/>
<circle cx="70" cy="62" r="16" fill="url(#moon)"/>
<path d="M0 150 C60 118 120 124 180 146 C240 168 300 128 400 136 L400 200 L0 200 Z" fill="url(#hill2)"/>
<path d="M0 172 C80 150 150 160 220 176 C290 192 340 164 400 168 L400 200 L0 200 Z" fill="url(#hill1)"/>
<g fill="#ffffff" opacity=".85"><path d="M196 40 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z"/><path d="M110 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z"/></g>
</svg>`;

/** Ảnh nền minh hoạ (trang trí, không có nội dung). */
export function SceneBanner({ ratio = 2 }: { ratio?: number }) {
  return <Image src={svgUrl(SCENE)} alt="" ratio={ratio} radius="2xl" loading="eager" />;
}

/** Ô trò chơi kiểu "kho game": biểu tượng to trong ô trắng bo tròn, tên và thông tin ngắn. */
export function GameTile({ game, caption }: { game: GameId; caption?: string }) {
  const meta = GAMES[game];
  return (
    <Card theme="subtle" color={meta.card} spacing="sm">
      <Stack gap="xs" align="center">
        <Box surface="surface" radius="2xl" padding="sm">
          <EmojiArt size="md">{meta.emoji}</EmojiArt>
        </Box>
        <Text textStyle="Body/Base/Bold" align="center">
          {meta.title}
        </Text>
        <Text textStyle="Caption/Regular" tone="base" align="center">
          {caption ?? (meta.kind === "challenge" ? `⏱ ${meta.seconds} giây · thử thách` : `⏱ ${meta.seconds} giây/câu`)}
        </Text>
      </Stack>
    </Card>
  );
}

/** Avatar nổi trên nền: viền trắng, như ảnh hồ sơ trong game. */
export function RaisedAvatar({ children }: { children: ReactNode }) {
  return (
    <Box surface="surface" radius="full" padding="2xs">
      {children}
    </Box>
  );
}
