# UIUX Warm-up

Web game khởi động cho học viên UI/UX: server Express + Socket.io (`server/`), luật chơi và nội dung dùng chung (`shared/`), giao diện React 19 (`src/`).

## Giao diện chỉ dùng Zen DS

- Mọi UI dựng bằng `@zen-ds/react`. Trước khi viết JSX, đọc `node_modules/@zen-ds/react/AGENTS.consumer.md` và chọn component theo `docs/guidelines/index.json` trong gói.
- CSS riêng chỉ cho phần trò chơi (`src/app.css`) và chỉ dùng token Zen.
- `ZenProvider` ở `src/App.tsx`: component theme mặc định (neutral), `locale="vi"`; màn điện thoại dùng `typography="mobile"`, `density="comfortable"`.
  Không dùng `brand-s1`/`brand-s2`: chữ trắng trên nút hồng Zen chỉ đạt 2.96:1.
- Màu sắc lấy từ prop của Zen. Màu brand dẫn dắt: các khối nổi bật (hero, màn giới thiệu, kết quả) là `Card theme="subtle" color="brand"`.
  Màu phụ (`Card theme="subtle" color=…`, `Badge theme`, `DockIcon theme`) cho phần nhỏ hơn: đáp án, team, trò chơi.
- Trên Canvas mặc định, hộp màu là `subtle`, không dùng `pale`. Không thêm bóng đổ lẻ: bóng chỉ dùng khi cả màn hình cùng dùng.
- Hình minh hoạ: emoji (`EmojiArt`, `HeroArt`), tranh nền SVG (`SceneBanner`), pháo giấy (`Confetti`). Màu trong tranh là nội dung, không phải giao diện.
- Không commit file nào của Zen DS, token hay licence key. Gói đến từ registry riêng (`.npmrc`).

## Kiểm tra trước khi commit

```bash
npm run check   # tsc + zen-usage --css + node:test
npm run build
npx zen-ds audit http://localhost:3000/ --routes=/,/host --dark   # cần playwright
```

Chơi thử cả buổi trên trình duyệt (1 màn chiếu và vài điện thoại) và xem ảnh chụp trước khi báo xong.

Nội dung câu hỏi viết bằng tiếng Việt, trong `shared/content.js`.
