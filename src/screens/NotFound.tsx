import { Container, EmptyState, Stack } from "@zen-ds/react";
import { navigate } from "../lib/router";

export function NotFound() {
  return (
    <Container maxWidth="sm">
      <Stack paddingY="2xl">
        <EmptyState title="Không tìm thấy trang này" headingLevel={2} icon="icon-flag-01-line" primaryAction={{ label: "Về trang chủ", onClick: () => navigate("/") }}>
          Kiểm tra lại đường link, hoặc nhập mã phòng ở trang chủ.
        </EmptyState>
      </Stack>
    </Container>
  );
}
