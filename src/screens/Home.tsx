import { useState, type FormEvent } from "react";
import { Box, Button, ChipGroup, Container, Divider, Grid, Heading, InputField, Stack, Text } from "@zen-ds/react";
import { GAMES, GAME_ORDER, type GameSet } from "../../shared/games.js";
import { EmojiArt } from "../components/Fun";
import { GameTile, SceneBanner } from "../components/Scene";
import { navigate } from "../lib/router";

const SETS: Array<{ id: GameSet; label: string; emoji: string; caption: string }> = [
  { id: "warmup", label: "Làm quen", emoji: "🎉", caption: "Không cần chuyên môn, chơi ngay buổi đầu để cả lớp làm quen." },
  { id: "uiux", label: "Chuyên môn UI/UX", emoji: "🧠", caption: "Kiến thức nền UI/UX, dùng cho các buổi học sau." },
];

/** Trang đầu: học viên nhập mã phòng, giảng viên tạo phòng. */
export function Home() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [set, setSet] = useState<GameSet>("warmup");
  const current = SETS.find((item) => item.id === set) ?? SETS[0];

  const join = (event: FormEvent) => {
    event.preventDefault();
    const clean = pin.replace(/\D/g, "");
    if (clean.length < 4) {
      setError("Mã phòng gồm 4 chữ số, xem trên màn hình chiếu.");
      return;
    }
    navigate(`/join/${clean}`);
  };

  return (
    <Container maxWidth="sm">
      <Stack gap="xl" paddingY="lg">
        <Stack gap="md">
          <SceneBanner ratio={1.8} />
          <div className="overlap-up">
            <Box surface="surface" radius="full" padding="sm">
              <EmojiArt size="lg">🎮</EmojiArt>
            </Box>
          </div>
          <Stack gap="xs" align="center">
            <Heading level={1} textStyle="Heading/1" align="center">
              UIUX Warm-up
            </Heading>
            <Text tone="base" align="center">
              Trò chơi 5–10 phút để cả lớp làm quen. Chơi cá nhân hoặc theo team, xếp hạng trực tiếp.
            </Text>
          </Stack>
        </Stack>

        <Box surface="surface" radius="2xl" padding="xl">
          <form onSubmit={join} noValidate>
            <Stack gap="md">
              <Heading level={2} textStyle="Heading/4">
                Học viên vào phòng
              </Heading>
              <InputField
                label="Mã phòng"
                placeholder="VD: 4821"
                inputMode="numeric"
                autoComplete="off"
                maxLength={5}
                size="lg"
                value={pin}
                error={error ?? undefined}
                onValueChange={(value) => {
                  setPin(value);
                  setError(null);
                }}
              />
              <Button level="primary" size="lg" type="submit" endIcon="icon-arrow-right-line">
                Vào phòng
              </Button>
              <Text textStyle="Caption/Regular" tone="base">
                Hoặc quét mã QR trên màn hình chiếu bằng camera điện thoại.
              </Text>
            </Stack>
          </form>
        </Box>

        <Stack gap="md">
          <Heading level={2} textStyle="Heading/4">
            Các trò chơi
          </Heading>
          <ChipGroup
            aria-label="Nhóm trò chơi"
            size="md"
            value={set}
            onValueChange={(value) => setSet(value as GameSet)}
            options={SETS.map((item) => ({ value: item.id, label: item.label, leading: <span aria-hidden="true">{item.emoji}</span> }))}
          />
          <Text textStyle="Body/Small/Regular" tone="base">
            {current.caption}
          </Text>
          <Grid columns={2} gap="sm">
            {GAME_ORDER.filter((id) => GAMES[id].set === set).map((id) => (
              <GameTile key={id} game={id} />
            ))}
          </Grid>
        </Stack>

        <Divider />

        <Stack gap="sm" align="start">
          <Heading level={2} textStyle="Heading/4">
            Giảng viên
          </Heading>
          <Text tone="base">Tạo phòng, chiếu mã QR lên màn hình lớn và điều khiển trò chơi.</Text>
          <Button level="tertiary" size="md" startIcon="icon-plus-line" onClick={() => navigate("/host")}>
            Tạo phòng chơi
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
