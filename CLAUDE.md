# UIUX Warm-up

Web game khởi động cho học viên UI/UX: server Express + Socket.io (`server/`), luật chơi và nội dung dùng chung (`shared/`), giao diện React 19 (`src/`).

## Giao diện chỉ dùng Zen DS

- Mọi UI dựng bằng `@zen-ds/react`. Trước khi viết JSX, đọc `node_modules/@zen-ds/react/AGENTS.consumer.md` và chọn component theo `docs/guidelines/index.json` trong gói.
- CSS riêng chỉ cho phần trò chơi (`src/app.css`) và chỉ dùng token Zen.
- `ZenProvider` ở `src/App.tsx`: theme `brand-s1`, `locale="vi"`; màn điện thoại dùng `typography="mobile"`, `density="comfortable"`.
- Màu sắc lấy từ prop của Zen: `Card theme="subtle" color=…`, `Card theme="solid"` (chỉ neutral, brand, cyan, yellow, orange, accent), `Badge theme`, `DockIcon theme`.
- Không commit file nào của Zen DS, token hay licence key. Gói đến từ registry riêng (`.npmrc`).

## Kiểm tra trước khi commit

```bash
npm run check   # tsc + zen-usage --css + node:test
npm run build
```

Nội dung câu hỏi viết bằng tiếng Việt, trong `shared/content.js`.
