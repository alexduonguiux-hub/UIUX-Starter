import { useMemo } from "react";

/** Hình minh hoạ lớn: một emoji chính ở giữa, vài emoji nhỏ bay lơ lửng xung quanh. Chỉ để trang trí. */
export function HeroArt({ main, bits = [], size = "lg" }: { main: string; bits?: string[]; size?: "md" | "lg" | "xl" }) {
  return (
    <div className={`hero-art hero-art--${size}`} aria-hidden="true">
      {bits.slice(0, 4).map((bit, index) => (
        <span key={index} className={`hero-art__bit hero-art__bit--${index}`}>
          {bit}
        </span>
      ))}
      <span className="hero-art__main">{main}</span>
    </div>
  );
}

/** Emoji cỡ lớn (Đuổi hình bắt chữ, kết quả). Chỉ để trang trí khi đã có chữ đi kèm. */
export function EmojiArt({ children, size = "lg", float = false, label }: { children: string; size?: "md" | "lg" | "xl"; float?: boolean; label?: string }) {
  return (
    <span className={`emoji-art emoji-art--${size}${float ? " emoji-art--float" : ""}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {children}
    </span>
  );
}

/** Pháo giấy rơi phủ màn hình, màu lấy từ token Zen. Tự tắt khi người dùng bật giảm chuyển động. */
export function Confetti({ pieces = 40 }: { pieces?: number }) {
  // Vị trí cố định theo chỉ số để mỗi lần hiển thị trông giống nhau và không nhảy khi render lại.
  const lefts = useMemo(() => Array.from({ length: pieces }, (_, index) => (index * 37 + 11) % 100), [pieces]);
  return (
    <div className="confetti" aria-hidden="true">
      {lefts.map((left, index) => (
        <span key={index} className="confetti__piece" style={{ left: `${left}%` }} />
      ))}
    </div>
  );
}
