# UIUX Warm-up 🎮

Web game khởi động 5–10 phút cho học viên trước buổi học UI/UX đầu tiên. Giảng viên chiếu mã QR lên màn hình, học viên quét bằng điện thoại để vào phòng, chơi **theo team** hoặc **cá nhân**, bảng xếp hạng cập nhật trực tiếp.

Giao diện dựng hoàn toàn bằng **Zen DS** (`@zen-ds/react`), theme màu Brand.

## Các trò chơi

Có hai bộ trò chơi. **Bộ làm quen** không cần chuyên môn, dùng cho buổi đầu. **Bộ chuyên môn UI/UX** dùng cho các buổi sau.

**Bộ làm quen**

| Trò chơi | Thời lượng | Cách chơi | Điểm |
| --- | --- | --- | --- |
| 🤝 **Đoán số đông** | 12 giây/câu | Biển hay núi, cà phê hay trà sữa, team chó hay team mèo… Mỗi lựa chọn có hình minh hoạ. | Chọn giống số đông: 500 |
| 🕵️ **Ai là ai?** | 15 giây/câu | Khi vào phòng, mỗi bạn viết một điều thú vị về mình. Cả lớp đoán xem ai viết. | Đoán đúng: 500 + tối đa 500 theo tốc độ. Người viết: 300 |
| 🧩 **Đuổi hình bắt chữ** | 20 giây/câu | Nhìn emoji, đoán thành ngữ, tên phim hoặc món ăn (🐸🕳️ = Ếch ngồi đáy giếng). | Đúng: 500 + tối đa 500 theo tốc độ |
| 🚦 **Phản xạ nhanh** | 40 giây | Màn hình đỏ thì chờ, chuyển xanh thì chạm thật nhanh. 5 lượt. | Tối đa 200 mỗi lượt, chạm sớm 0 |
| 🎨 **Mắt thần màu sắc** | 40 giây | Tìm ô khác màu trong lưới, càng lên cao càng khó. | 50 mỗi ô đúng |

**Bộ chuyên môn UI/UX**

| Trò chơi | Thời lượng | Cách chơi |
| --- | --- | --- |
| 🧠 **Quiz nhanh UI/UX** | 20 giây/câu | Trắc nghiệm WCAG, Fitts, Hick, Auto layout, Persona, lưới 8pt… |
| 🆚 **A hay B?** | 20 giây/câu | Chọn thiết kế tốt hơn, rồi xem nguyên tắc: tương phản, căn lề, phân cấp, Gestalt, thứ bậc nút, vùng chạm. |
| 🎯 **Pixel Perfect** | 45 giây | Chạm đúng tâm của 5 hình. |
| 🎨 **Mắt thần màu sắc** | 40 giây | Dùng chung với bộ làm quen. |

**Gói chơi gợi ý**

- **Làm quen nhanh (~6 phút):** 2 câu Đoán số đông, 3 câu Ai là ai?, 3 câu Đuổi hình bắt chữ, Phản xạ nhanh.
- **Làm quen trọn bộ (~8 phút):** thêm câu cho từng trò và Mắt thần màu sắc.
- **Chuyên môn UI/UX (~8 phút):** 5 câu Quiz, 3 câu A hay B?, Mắt thần màu sắc, Pixel Perfect.
- **Tự chọn:** chọn từng trò và số câu, từ cả hai bộ.

**Chế độ chơi**

- **Theo team:** 2–6 team (Pixel, Vector, Layer, Grid, Gradient, Kerning). Chia tự động cho đều người, hoặc học viên tự chọn team. Điểm team tính theo trung bình mỗi thành viên (công bằng khi team chênh người) hoặc tổng điểm.
- **Cá nhân:** chỉ có bảng xếp hạng cá nhân.

Học viên chọn avatar con vật khi vào phòng. Sau mỗi câu có màn công bố đáp án, ô thống kê điểm, hạng và chuỗi đúng, rồi bảng xếp hạng. Có từ 3 team thì màn chiếu hiện biểu đồ "Đường đua các team". Cuối buổi có bục nhận giải top 3, pháo giấy và team vô địch.

## Cách dùng trong lớp

1. Giảng viên mở trang chủ, bấm **Tạo phòng chơi**, chọn cách chơi và gói trò chơi.
2. Chiếu màn hình phòng chờ lên máy chiếu: có mã QR, đường link và mã phòng 4 số.
3. Học viên quét QR (hoặc vào trang chủ, nhập mã phòng), chọn avatar, nhập tên và một điều thú vị về mình (cho trò "Ai là ai?"). Mất mạng hay khoá màn hình thì mở lại link là vào lại đúng chỗ, giữ nguyên điểm.
   "Ai là ai?" chỉ dùng các điều thú vị đã viết trước khi bấm **Bắt đầu**; nếu chưa ai viết, phần này tự bỏ qua. Màn chiếu hiện số bạn đã viết.
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
- `POLLS`: câu Đoán số đông, mỗi câu 2 lựa chọn, mỗi lựa chọn có một emoji minh hoạ.
- `REBUS`: câu Đuổi hình bắt chữ: chuỗi emoji, 4 đáp án, loại (Thành ngữ, Phim, Món ăn).

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

Kiểm tra giao diện đã render trong Chromium (tràn ngang, tên điều khiển, tương phản, kiểu chữ và token Zen, chế độ tối):

```bash
npm i -D playwright axe-core && npx playwright install chromium
npm run build && npm start
npx zen-ds audit http://localhost:3000/ --routes=/,/host --dark
```

Màn học viên (`/join/<mã>`) báo cảnh báo "no h1": tiêu đề của TopNavigation là heading cấp 1 theo ARIA nhưng công cụ audit chỉ đếm thẻ `h1`. Đây là lệch giữa hai phần của Zen DS, không phải lỗi của game.

## Ý tưởng mở rộng

Các trò 5–10 phút khác có thể thêm sau:

- **2 sự thật 1 lời nói dối:** mỗi bạn viết 3 câu về mình, cả lớp đoán câu nào là nói dối.
- **Vẽ nhanh 60 giây:** mỗi bạn phác một hình theo đề, cả lớp bình chọn.
- **Sắp xếp quy trình:** kéo các bước Design Thinking vào đúng thứ tự (cho bộ chuyên môn).
- **Tìm lỗi UX:** chạm vào chỗ sai trên một màn hình mẫu (cho bộ chuyên môn).

## Giấy phép Zen DS

`@zen-ds/react` là gói có bản quyền của Dizai Studio. Repo này chỉ khai báo gói trong `package.json` và `.npmrc`, không chứa file nào của Zen DS. Không commit `node_modules`, token hay licence key.
