const number = new Intl.NumberFormat("vi-VN");

/** 1250 → "1.250" */
export const formatPoints = (value: number) => number.format(value);

/** "1.250 điểm" */
export const points = (value: number) => `${formatPoints(value)} điểm`;

/** "Hạng 3/25" */
export const rankLabel = (rank: number, total: number) => `Hạng ${rank}/${total}`;

/** Giây còn lại, làm tròn lên. */
export const secondsLeft = (endsAt: number | null, now: number) => (endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0);

/** "~5 phút" */
export const minutesLabel = (seconds: number) => `~${Math.max(1, Math.round(seconds / 60))} phút`;

/** Viết tắt tên: "Minh Anh" → "MA". */
export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toLocaleUpperCase("vi"))
    .join("") || "?";

/** SVG thành data URL cho Image. */
export const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
