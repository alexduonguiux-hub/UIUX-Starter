# UIUX Warm-up

Web game khởi động cho học viên UI/UX: server Express + Socket.io (`server/`), luật chơi và nội dung dùng chung (`shared/`), giao diện React 19 (`src/`).

## Giao diện dựng bằng Zen DS

- Mọi UI dựng bằng `@zen-ds/react`. Trước khi viết JSX, đọc `node_modules/@zen-ds/react/AGENTS.consumer.md` và chọn component theo `docs/guidelines/index.json` trong gói.
- CSS riêng chỉ cho phần trò chơi và bố cục màn chiếu (`src/app.css`), chỉ dùng token Zen.
- `ZenProvider` ở `src/App.tsx`: màn điện thoại dùng `typography="mobile"`; màn chiếu (`/host/:pin`) dùng `"popular"`, thang chữ lớn nhất, để cuối lớp đọc được; trang tạo phòng dùng `"dashboard"`.
  Không dùng `brand-s1`/`brand-s2`: chữ trắng trên nút hồng Zen chỉ đạt 2.96:1.
- Danh sách (`List`) không có lề hai bên: luôn đặt trong `ListBox` (hoặc hộp có padding từ `xl`).
- Không sửa gói Zen DS. Hai token chưa đạt WCAG được đặt lại trong `src/app.css`, cùng bộ chọn khối màu sáng của Zen: chữ phụ `content-neutral-light` (pha 35% bậc alpha-11, 4.67–4.88:1) và vòng focus `focus-accent-solid` (brand-10, từ 3.72:1). Chế độ tối giữ nguyên vì đã đạt.
- Không commit file nào của Zen DS, token hay licence key. Gói đến từ registry riêng (`.npmrc`).

## Hình minh hoạ

- Emoji hiển thị bằng hình 3D Microsoft Fluent Emoji (MIT) qua `Emoji`, `EmojiArt`, `HeroArt` trong `src/components/Fun.tsx`. Không để emoji dạng chữ trong giao diện: mỗi máy vẽ một kiểu.
- Thêm emoji mới thì chạy `npm run emoji` (sinh `public/emoji` và `src/lib/emoji-files.ts`).
- Avatar con vật luôn trên nền trắng (`PlayerAvatar` theme photo, `AvatarTile`).

## Bảng phối màu

Đo bằng OKLCH: các thẻ Subtle của Zen có cùng độ sáng (L ≈ 0.94–0.95), nên chỉ cần chọn sắc độ cho hài hoà.

- Màu brand (hồng 341°) dẫn dắt. Màu phụ chỉ lấy từ bộ năm: hồng brand, tím (analogous), vàng và xanh ngọc cyan (bộ ba với brand), xanh lá (gần bù với brand).
- Màu trò chơi (`shared/games.js`): Đoán số đông, Đua bấm, Quiz cyan · Ai là ai?, Phản xạ vàng · Thật hay đùa?, Lật hình, A hay B? tím · Đuổi hình bắt chữ, Mắt thần màu sắc brand · Đoán gần đúng, Pixel Perfect xanh lá. Hai ô cạnh nhau trong mọi lưới hai cột không trùng màu, và màu thẻ tương phản với màu chính của hình 3D.
- Team theo thứ tự cyan, hồng, vàng, xanh lá, tím, cam: 2 hay 3 team đầu luôn cách xa nhau trên vòng màu.
- Đáp án A/B/C/D: hồng, xanh dương, vàng, xanh lá (bộ bốn cách 66–112°), kèm hình và chữ cái để không chỉ dựa vào màu.
- Bục nhận giải: vàng (hạng 1), xanh dừa cạn indigo-soft (hạng 2), cam đào orange-soft (hạng 3); số hạng dùng màu chữ đậm nhất cùng sắc.
- Trên Canvas mặc định, hộp màu là `subtle`. Không thêm bóng đổ lẻ.

## Bố cục desktop

- Màn chiếu nằm gọn một khung 16:9, không cuộn: thanh trên · (tiến trình) · sân khấu `host-main` · ActionBar. Sân khấu hai cột khi có hai loại nội dung (`split` 5/7, `board` 7/5, `half`).
- Màn chiếu luôn chế độ sáng (laptop để tối thì máy chiếu vẫn sáng). Trên 7 phần chơi thì tiến trình là một dòng "Phần x/y" kèm thanh, thay cho Stepper.
- Đường đua các team tự vẽ (`.race`), mỗi thanh theo màu của team. Phòng chờ: thẻ team tự chia cột (tối thiểu 240px), lớp trên 12 bạn dùng avatar nhỏ hơn.
- Kiểm tra ở 1280×720, 1366×640 và 1920×1080. Dưới 820px chiều cao bỏ thanh tiến trình; dưới 760px dùng chế độ gọn (tiêu đề nhỏ một bậc, thẻ đáp án `dense`). Mã QR, bục và hình minh hoạ co theo chiều cao.
- Trang chủ và trang tạo phòng chia hai cột từ 1024px. Màn học viên trên laptop giữ một cột giữa màn hình. Bố cục điện thoại giữ nguyên.

## Kiểm tra trước khi commit

```bash
npm run check   # tsc + zen-usage --css + node:test
npm run build
npx zen-ds audit http://localhost:3000/ --routes=/,/host --dark   # cần playwright
```

Chơi thử cả buổi trên trình duyệt (1 màn chiếu ở các cỡ trên và vài điện thoại), xem ảnh chụp và đo: không tràn ngang, màn chiếu không cao hơn khung, lề trái/phải của thanh trên, sân khấu và ActionBar thẳng hàng.

Nội dung câu hỏi viết bằng tiếng Việt, trong `shared/content.js`.
