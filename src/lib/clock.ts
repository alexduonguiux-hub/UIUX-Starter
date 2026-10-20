import { useEffect, useState } from "react";

/** Chênh lệch giữa đồng hồ server và máy này (ms). */
let offset = 0;

export function syncClock(serverNow: number) {
  offset = serverNow - Date.now();
}

export const serverNow = () => Date.now() + offset;

/** Giờ server, cập nhật mỗi `interval` ms (dùng cho đồng hồ đếm ngược). */
export function useServerNow(interval = 250, active = true) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    if (!active) return;
    setNow(serverNow());
    const id = window.setInterval(() => setNow(serverNow()), interval);
    return () => window.clearInterval(id);
  }, [interval, active]);
  return now;
}
