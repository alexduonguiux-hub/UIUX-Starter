import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Box, IconButton, Image, Stack, Text, useToast } from "@zen-ds/react";

/** Địa chỉ gốc học viên dùng để vào phòng. Mở bằng localhost thì đổi sang địa chỉ Wi‑Fi để điện thoại vào được. */
export function useJoinBase() {
  const [base, setBase] = useState(window.location.origin);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/info")
      .then((response) => response.json() as Promise<{ publicUrl: string | null; lanUrls: string[] }>)
      .then((info) => {
        if (cancelled) return;
        const local = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
        if (info.publicUrl) setBase(info.publicUrl);
        else if (local && info.lanUrls[0]) setBase(info.lanUrls[0]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return base;
}

/** Mã QR (đen trên nền trắng để camera đọc được cả ở chế độ tối) và đường link vào phòng. */
export function JoinQr({ url, pin, size = 280 }: { url: string; pin: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 2, width: size * 2, errorCorrectionLevel: "M" })
      .then((value) => !cancelled && setDataUrl(value))
      .catch(() => !cancelled && setDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Đã sao chép link vào phòng" });
    } catch {
      toast({ title: "Không sao chép được, hãy chép tay đường link" });
    }
  };

  const shown = url.replace(/^https?:\/\//, "");

  return (
    <Stack gap="md" align="center">
      <Box width={size} height={size} radius="xl" clip>
        <Image src={dataUrl ?? undefined} alt={`Mã QR vào phòng ${pin}`} ratio={1} fit="contain" radius="xl" loading="eager" />
      </Box>
      <Stack direction="row" gap="xs" align="center" justify="center" wrap>
        <Text textStyle="Body/Extra/Medium" align="center">
          {shown}
        </Text>
        <IconButton appearance="flat" level="primary" icon="icon-copy-line" aria-label="Sao chép link vào phòng" onClick={() => void copy()} />
      </Stack>
    </Stack>
  );
}
