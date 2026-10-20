import { lazy, Suspense } from "react";
import { Text, ZenProvider } from "@zen-ds/react";
import { usePath } from "./lib/router";
import { Home } from "./screens/Home";
import { NotFound } from "./screens/NotFound";
import { PlayerRoom } from "./screens/PlayerRoom";

// Màn của giảng viên tải riêng, để điện thoại học viên tải nhẹ hơn.
const HostSetup = lazy(() => import("./screens/HostSetup").then((m) => ({ default: m.HostSetup })));
const HostRoom = lazy(() => import("./screens/HostRoom").then((m) => ({ default: m.HostRoom })));

/** Đường dẫn: / · /host · /host/:pin · /join/:pin */
function route(path: string) {
  const clean = path.replace(/\/+$/, "") || "/";
  if (clean === "/") return { screen: "home" as const };
  if (clean === "/host") return { screen: "setup" as const };
  const host = clean.match(/^\/host\/(\d{4,5})$/);
  if (host) return { screen: "host" as const, pin: host[1] };
  const join = clean.match(/^\/(?:join|j)\/(\d{4,5})$/);
  if (join) return { screen: "player" as const, pin: join[1] };
  return { screen: "missing" as const };
}

export function App() {
  const path = usePath();
  const current = route(path);
  // Màn của giảng viên chiếu lên máy chiếu (desktop); màn học viên là điện thoại.
  const phone = current.screen === "player" || current.screen === "home" || current.screen === "missing";

  return (
    <ZenProvider
      key={phone ? "phone" : "desktop"}
      theme="system"
      componentTheme="brand-s1"
      locale="vi"
      typography={phone ? "mobile" : "dashboard"}
      density={phone ? "comfortable" : "compact"}
    >
      <Suspense fallback={<Text tone="base">Đang tải…</Text>}>
        {current.screen === "home" && <Home />}
        {current.screen === "setup" && <HostSetup />}
        {current.screen === "host" && <HostRoom key={current.pin} pin={current.pin} />}
        {current.screen === "player" && <PlayerRoom key={current.pin} pin={current.pin} />}
        {current.screen === "missing" && <NotFound />}
      </Suspense>
    </ZenProvider>
  );
}
