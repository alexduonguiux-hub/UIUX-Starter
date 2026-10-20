import { useState, type FormEvent } from "react";
import { Box, Button, Card, Container, Divider, DockIcon, Heading, InputField, Stack, Text } from "@zen-ds/react";
import { GAMES, GAME_ORDER } from "../../shared/games.js";
import { GameMark } from "../components/common";
import { navigate } from "../lib/router";

/** Trang đầu: học viên nhập mã phòng, giảng viên tạo phòng. */
export function Home() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      <Stack gap="xl" paddingY="2xl">
        <Card theme="solid" color="brand">
          <Stack gap="md" align="center" paddingY="md">
            <DockIcon theme="emoji" emoji="🎮" size="2xl" label="UIUX Warm-up" />
            <Stack gap="xs" align="center">
              <Heading level={1} textStyle="Heading/1" align="center">
                UIUX Warm-up
              </Heading>
              <Text tone="base" align="center">
                Trò chơi khởi động 5–10 phút trước buổi học đầu tiên. Chơi cá nhân hoặc theo team, xếp hạng trực tiếp.
              </Text>
            </Stack>
          </Stack>
        </Card>

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
          <Stack gap="sm">
            {GAME_ORDER.map((id) => (
              <Card key={id} theme="subtle" color={GAMES[id].card} spacing="sm">
                <Stack direction="row" gap="sm" align="center">
                  <GameMark game={id} />
                  <Stack gap="none" width="fill">
                    <Text textStyle="Body/Base/Bold">{GAMES[id].title}</Text>
                    <Text textStyle="Body/Small/Regular" tone="base">
                      {GAMES[id].short}
                    </Text>
                  </Stack>
                </Stack>
              </Card>
            ))}
          </Stack>
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
