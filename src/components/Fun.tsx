import { useMemo } from "react";
import { EMOJI_FILES } from "../lib/emoji-files";

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("vi", { granularity: "grapheme" }) : null;

/** Tách chuỗi thành từng ký tự hiển thị (một emoji ghép như 🕵️ là một ký tự). */
export const splitGraphemes = (text: string) => (segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text));

/** Đường dẫn hình 3D của một emoji, hoặc null nếu bộ hình không có. */
export const emojiSrc = (emoji: string) => {
  const code = EMOJI_FILES[emoji] ?? EMOJI_FILES[emoji.replace(/️/g, "")];
  return code ? `/emoji/${code}.webp` : null;
};

/**
 * Emoji 3D (Microsoft Fluent Emoji): mỗi emoji là một hình cùng phong cách trên mọi máy, cỡ theo cỡ chữ xung quanh.
 * Emoji không có trong bộ hình thì hiện bằng phông chữ. Có `label` thì đọc được bằng trình đọc màn hình, không có thì là trang trí.
 */
export function Emoji({ children, label }: { children: string; label?: string }) {
  const parts = splitGraphemes(children);
  return (
    <span className="emoji" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {parts.map((part, index) => {
        const src = emojiSrc(part);
        return src ? <img key={index} className="emoji__img" src={src} alt="" draggable={false} decoding="async" /> : <span key={index}>{part}</span>;
      })}
    </span>
  );
}

/** Hình minh hoạ lớn: một emoji chính ở giữa, vài emoji nhỏ bay lơ lửng xung quanh. Chỉ để trang trí. */
export function HeroArt({ main, bits = [], size = "lg" }: { main: string; bits?: string[]; size?: "md" | "lg" | "xl" }) {
  return (
    <div className={`hero-art hero-art--${size}`} aria-hidden="true">
      {bits.slice(0, 4).map((bit, index) => (
        <span key={index} className={`hero-art__bit hero-art__bit--${index}`}>
          <Emoji>{bit}</Emoji>
        </span>
      ))}
      <span className="hero-art__main">
        <Emoji>{main}</Emoji>
      </span>
    </div>
  );
}

/** Emoji cỡ lớn (Đuổi hình bắt chữ, kết quả). Chỉ để trang trí khi đã có chữ đi kèm. */
export function EmojiArt({ children, size = "lg", float = false, label }: { children: string; size?: "sm" | "md" | "lg" | "xl"; float?: boolean; label?: string }) {
  return (
    <span className={`emoji-art emoji-art--${size}${float ? " emoji-art--float" : ""}`}>
      <Emoji label={label}>{children}</Emoji>
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
