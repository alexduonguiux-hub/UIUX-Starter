# UIUX Warm-up 🎮

Web game khởi động 5–10 phút cho học viên trước buổi học UI/UX đầu tiên. Giảng viên chiếu mã QR lên màn hình, học viên quét bằng điện thoại để vào phòng, chơi **theo team** hoặc **cá nhân**, bảng xếp hạng cập nhật trực tiếp.

Giao diện dựng hoàn toàn bằng **Zen DS** (`@zen-ds/react`), theme màu Brand.

## Các trò chơi

| Trò chơi | Thời lượng | Cách chơi | Điểm |
| --- | --- | --- | --- |
| 🤝 **Đoán số đông** | 12 giây/câu | Chọn 1 trong 2 (Dark mode hay Light mode, Cà phê hay Trà sữa…). Giúp cả lớp làm quen sở thích của nhau. | Chọn giống số đông: 500 |
| ⚡ **Quiz nhanh UI/UX** | 20 giây/câu | Trắc nghiệm kiến thức nền: WCAG, Fitts, Hick, Auto layout, Persona, lưới 8pt… | Đúng: 500 + tối đa 500 theo tốc độ |
| 🆚 **A hay B?** | 20 giây/câu | Hai thiết kế, chọn cái tốt hơn. Sau đó hiện nguyên tắc: tương phản, căn lề, phân cấp, Gestalt, thứ bậc nút, vùng chạm. | Đúng: 500 + tối đa 500 theo tốc độ |
| 🎨 **Mắt thần màu sắc** | 40 giây | Tìm ô khác màu trong lưới. Lưới to dần, màu sát nhau dần. Chạm sai bị khoá 1 giây. | 50 mỗi ô đúng |
| 🎯 **Pixel Perfect** | 45 giây | Chạm đúng tâm của 5 hình (có cả hình vòng rỗng). | Tối đa 300 mỗi hình |

**Gói chơi gợi ý**

- **Khởi động nhanh (~5 phút):** 2 câu Đoán số đông, 4 câu Quiz, 1 lượt Mắt thần màu sắc.
- **Trọn bộ (~9 phút):** 3 câu Đoán số đông, 5 câu Quiz, 3 câu A hay B, Mắt thần màu sắc, Pixel Perfect.
- **Tự chọn:** chọn từng trò và số câu.

**Chế độ chơi**

- **Theo team:** 2–6 team (Pixel, Vector, Layer, Grid, Gradient, Kerning). Chia tự động cho đều người, hoặc học viên tự chọn team. Điểm team tính theo trung bình mỗi thành viên (công bằng khi team chênh người) hoặc tổng điểm.
- **Cá nhân:** chỉ có bảng xếp hạng cá nhân.

Mỗi học viên luôn có điểm cá nhân. Sau mỗi câu có màn công bố đáp án, giải thích và bảng xếp hạng. Cuối buổi có bục nhận giải top 3 và team vô địch.

## Cách dùng trong lớp

1. Giảng viên mở trang chủ, bấm **Tạo phòng chơi**, chọn cách chơi và gói trò chơi.
2. Chiếu màn hình phòng chờ lên máy chiếu: có mã QR, đường link và mã phòng 4 số.
3. Học viên quét QR (hoặc vào trang chủ, nhập mã phòng), nhập tên. Mất mạng hay khoá màn hình thì mở lại link là vào lại đúng chỗ, giữ nguyên điểm.
4. Giảng viên bấm **Bắt đầu** và điều khiển từng phần. Câu hỏi tự đóng khi hết giờ hoặc khi mọi người đã trả lời.
5. Học viên vào muộn vẫn được, chơi tiếp từ câu sau. Giảng viên có thể mời ra khỏi phòng một tên không phù hợp (nút ⋯ cạnh tên).

## Chạy trên máy

Cần Node.js 20.19 trở lên và tài khoản Zen DS (gói `@zen-ds/react` chỉ có trên registry riêng của Zen).

```bash
# Đăng nhập registry Zen một lần trên máy (mở trình duyệt để đăng nhập Google)
npm login --registry=https://npm.dizai.studio/ --scope=@zen-ds

npm install
npm run dev        # http://localhost:3000
```

Khi mở bằng `localhost`, mã QR tự dùng địa chỉ Wi‑Fi của máy (ví dụ `http://192.168.1.20:3000`), nên điện thoại cùng mạng Wi‑Fi quét là vào được. Nếu mạng của lớp chặn kết nối giữa các máy, hãy triển khai lên mạng như bên dưới.

Bản chạy thật:

```bash
npm run build
npm start          # PORT mặc định 3000
```

## Triển khai lên mạng

Ứng dụng là một server Node.js (Express + Socket.io) phục vụ luôn giao diện. Chỉ cần **một** instance (trạng thái phòng chơi nằm trong bộ nhớ).

**Render (có sẵn `render.yaml`)**

1. Lấy CI token của Zen DS một lần, trên máy của bạn (Password là licence key):
   ```bash
   npm login --registry=https://npm.dizai.studio/ --scope=@zen-ds --auth-type=legacy --userconfig=./ci-token.npmrc
   ```
   Chép giá trị sau `//npm.dizai.studio/:_authToken=` trong `ci-token.npmrc`, rồi xoá file này.
2. Trên Render: **New → Blueprint**, chọn repo này. Khi được hỏi, dán token vào biến `ZEN_DS_NPM_TOKEN`.
3. Link của bạn sẽ có dạng `https://uiux-warmup.onrender.com`. Mã QR trong phòng chờ tự dùng link này.

Gói Free của Render ngủ sau 15 phút không dùng: mở trang khoảng 1 phút trước giờ chơi để server thức dậy.

**Docker (Railway, Fly.io, VPS…)**

```bash
docker build --secret id=zen_npm_token,env=ZEN_DS_NPM_TOKEN -t uiux-warmup .
docker run -p 3000:3000 uiux-warmup
```

**Biến môi trường**

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng server, mặc định 3000. |
| `PUBLIC_URL` | Không bắt buộc. Địa chỉ gắn vào mã QR khi server đứng sau proxy hoặc tên miền riêng, ví dụ `https://game.dizai.studio`. |
| `ZEN_DS_NPM_TOKEN` | Chỉ dùng lúc build, để tải `@zen-ds/react`. Không bao giờ commit token vào repo. |

## Sửa nội dung câu hỏi

Toàn bộ câu hỏi nằm trong [`shared/content.js`](shared/content.js):

- `QUIZ`: câu trắc nghiệm, `answer` là vị trí đáp án đúng (bắt đầu từ 0), có thể kèm ô màu hoặc hình SVG.
- `AB`: cặp thiết kế tốt/chưa tốt dạng SVG, kèm nguyên tắc và giải thích. Server tự xáo vị trí A/B.
- `POLLS`: câu Đoán số đông, mỗi câu 2 lựa chọn.

Luật chơi, thời gian, điểm và gói chơi nằm trong [`shared/games.js`](shared/games.js).

## Cấu trúc

```
server/      Express + Socket.io, logic phòng chơi (room.js)
shared/      Nội dung câu hỏi và luật chơi, dùng chung cho server và trình duyệt
src/         Giao diện React + Zen DS
  screens/   Trang chủ, tạo phòng, màn chiếu của giảng viên, màn điện thoại của học viên
  games/     Hai trò thử thách: Mắt thần màu sắc, Pixel Perfect
tests/       Kiểm thử logic chơi (node:test)
```

## Kiểm tra

```bash
npm run check      # TypeScript + luật dùng Zen DS (zen-usage) + kiểm thử logic
```

## Ý tưởng mở rộng

Các trò 5–10 phút khác hợp với lớp UI/UX, có thể thêm sau:

- **Vẽ nhanh 60 giây:** mỗi bạn phác một icon theo đề, cả lớp bình chọn.
- **Sắp xếp quy trình:** kéo các bước Design Thinking hoặc quy trình làm sản phẩm vào đúng thứ tự.
- **Tìm lỗi UX:** chạm vào chỗ sai trên một màn hình mẫu.
- **Đoán font:** nhìn chữ mẫu, chọn tên font.
- **2 sự thật 1 lời nói dối:** mỗi team giới thiệu bản thân, các team khác đoán.

## Giấy phép Zen DS

`@zen-ds/react` là gói có bản quyền của Dizai Studio. Repo này chỉ khai báo gói trong `package.json` và `.npmrc`, không chứa file nào của Zen DS. Không commit `node_modules`, token hay licence key.
