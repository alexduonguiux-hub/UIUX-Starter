import { useEffect, useState } from "react";
import { io } from "socket.io-client";

export const socket = io({ transports: ["websocket", "polling"] });

/** Gửi một sự kiện và chờ server trả lời (tối đa 8 giây). */
export function request<T = { ok?: boolean; error?: string }>(event: string, payload?: unknown): Promise<T> {
  return new Promise((resolve) => {
    socket.timeout(8000).emit(event, payload, (error: Error | null, response: T) => {
      resolve(error ? ({ error: "Mạng chậm quá, thử lại nhé." } as T) : response);
    });
  });
}

export type ConnectionStatus = "connected" | "reconnecting";

/** Trạng thái kết nối tới server. */
export function useConnection(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(socket.connected ? "connected" : "reconnecting");
  useEffect(() => {
    const up = () => setStatus("connected");
    const down = () => setStatus("reconnecting");
    socket.on("connect", up);
    socket.on("disconnect", down);
    socket.io.on("reconnect_attempt", down);
    return () => {
      socket.off("connect", up);
      socket.off("disconnect", down);
      socket.io.off("reconnect_attempt", down);
    };
  }, []);
  return status;
}

/** Chạy lại `handler` mỗi khi socket (tái) kết nối, để vào lại phòng sau khi mất mạng. */
export function useOnConnect(handler: () => void, deps: unknown[]) {
  useEffect(() => {
    if (socket.connected) handler();
    socket.on("connect", handler);
    return () => {
      socket.off("connect", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
