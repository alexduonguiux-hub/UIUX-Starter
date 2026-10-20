// Nội dung trò chơi. Giảng viên có thể sửa trực tiếp file này: thêm câu hỏi, đổi đáp án, đổi câu bình chọn.
// Server chọn ngẫu nhiên câu hỏi từ các danh sách bên dưới cho mỗi phòng chơi.

/**
 * Quiz trắc nghiệm. `answer` là vị trí đáp án đúng trong `options` (bắt đầu từ 0).
 * `visual` (tuỳ chọn): { type: "swatch", color } hiện một ô màu, { type: "svg", svg, alt } hiện một hình minh hoạ.
 * @type {Array<{ id: string, prompt: string, options: string[], answer: number, explain?: string, visual?: { type: "swatch", color: string } | { type: "svg", svg: string, alt: string } }>}
 */
export const QUIZ = [
  {
    id: "ux-meaning",
    prompt: "UX là viết tắt của cụm từ nào?",
    options: ["User Experience", "User Extension", "Universal Experience", "User Export"],
    answer: 0,
    explain: "UX (User Experience) là toàn bộ trải nghiệm của người dùng khi tương tác với sản phẩm.",
  },
  {
    id: "wcag-contrast",
    prompt: "Theo WCAG cấp AA, chữ cỡ thường cần tỷ lệ tương phản tối thiểu là bao nhiêu?",
    options: ["2:1", "3:1", "4.5:1", "7:1"],
    answer: 2,
    explain: "AA yêu cầu 4.5:1 cho chữ thường và 3:1 cho chữ lớn. 7:1 là mức AAA.",
  },
  {
    id: "touch-target",
    prompt: "Apple khuyến nghị vùng chạm tối thiểu của một nút trên iOS là bao nhiêu?",
    options: ["24 × 24 pt", "32 × 32 pt", "44 × 44 pt", "64 × 64 pt"],
    answer: 2,
    explain: "44 × 44 pt giúp ngón tay chạm trúng dễ dàng. Material Design dùng 48 × 48 dp.",
  },
  {
    id: "fitts",
    prompt: "Định luật Fitts nói gì?",
    options: [
      "Mục tiêu càng to và càng gần thì càng nhanh chạm tới",
      "Càng nhiều lựa chọn thì quyết định càng lâu",
      "Người dùng chỉ nhớ khoảng 7 mục cùng lúc",
      "Thiết kế đẹp thì được xem là dễ dùng hơn",
    ],
    answer: 0,
    explain: "Fitts: thời gian chạm tới mục tiêu phụ thuộc khoảng cách và kích thước của nó. Phương án 2 là định luật Hick.",
  },
  {
    id: "hick",
    prompt: "Định luật Hick: thời gian ra quyết định tăng lên khi…",
    options: ["Nút bấm to hơn", "Số lựa chọn nhiều hơn", "Màu sắc đậm hơn", "Chữ nhỏ hơn"],
    answer: 1,
    explain: "Càng nhiều lựa chọn, người dùng càng mất thời gian cân nhắc. Hãy gom nhóm và ưu tiên.",
  },
  {
    id: "auto-layout",
    prompt: "Trong Figma, tính năng nào giúp khung tự co giãn theo nội dung bên trong?",
    options: ["Smart animate", "Boolean groups", "Auto layout", "Mask"],
    answer: 2,
    explain: "Auto layout xếp các lớp theo hàng hoặc cột, có khoảng cách và padding, và tự co giãn theo nội dung.",
  },
  {
    id: "wireframe",
    prompt: "Wireframe thường được dùng để làm gì?",
    options: [
      "Chạy thử code thật",
      "Phác cấu trúc và bố cục, chưa cần màu sắc chi tiết",
      "Chọn font chữ cuối cùng",
      "Đo tốc độ tải trang",
    ],
    answer: 1,
    explain: "Wireframe tập trung vào bố cục và luồng nội dung, giúp thảo luận nhanh trước khi làm giao diện chi tiết.",
  },
  {
    id: "grid-8pt",
    prompt: "Hệ thống lưới 8pt nghĩa là gì?",
    options: [
      "Chỉ dùng tối đa 8 màu",
      "Cỡ chữ luôn là 8pt",
      "Khoảng cách và kích thước là bội số của 8",
      "Bố cục có tối đa 8 cột",
    ],
    answer: 2,
    explain: "Dùng các bội số 4/8 (8, 16, 24, 32…) giúp khoảng cách nhất quán và dễ bàn giao cho lập trình viên.",
  },
  {
    id: "persona",
    prompt: "Persona trong UX là gì?",
    options: [
      "Chân dung người dùng đại diện, dựa trên nghiên cứu",
      "Một bộ font chữ",
      "Bảng màu thương hiệu",
      "Một plugin của Figma",
    ],
    answer: 0,
    explain: "Persona tóm tắt mục tiêu, hành vi và nỗi đau của một nhóm người dùng để cả team cùng hiểu họ.",
  },
  {
    id: "design-thinking",
    prompt: "Quy trình Design Thinking bắt đầu bằng bước nào?",
    options: ["Tạo mẫu (Prototype)", "Thử nghiệm (Test)", "Lên ý tưởng (Ideate)", "Thấu cảm (Empathize)"],
    answer: 3,
    explain: "Empathize → Define → Ideate → Prototype → Test. Hiểu người dùng trước rồi mới giải quyết vấn đề.",
  },
  {
    id: "hex-white",
    prompt: "Mã HEX của màu trắng là gì?",
    options: ["#000000", "#FFFFFF", "#FF0000", "#F0F0F0"],
    answer: 1,
    explain: "#FFFFFF là đỏ, xanh lá và xanh dương cùng ở mức tối đa (255, 255, 255).",
  },
  {
    id: "hex-swatch",
    prompt: "Ô màu này có mã HEX nào?",
    visual: { type: "swatch", color: "#2563EB" },
    options: ["#EB2563", "#25EB63", "#2563EB", "#63EB25"],
    answer: 2,
    explain: "Kênh xanh dương (EB) cao nhất nên màu nghiêng về xanh dương.",
  },
  {
    id: "nielsen-5",
    prompt: "Theo Nielsen, kiểm thử khả dụng với khoảng bao nhiêu người là đủ để phát hiện phần lớn vấn đề?",
    options: ["1 người", "5 người", "50 người", "500 người"],
    answer: 1,
    explain: "5 người thường phát hiện khoảng 85% vấn đề. Làm nhiều vòng nhỏ hiệu quả hơn một vòng lớn.",
  },
  {
    id: "affordance",
    prompt: "Affordance trong thiết kế là gì?",
    options: [
      "Chi phí làm ra sản phẩm",
      "Đặc điểm gợi ý cách sử dụng một thành phần",
      "Tốc độ phản hồi của ứng dụng",
      "Tên gọi khác của logo",
    ],
    answer: 1,
    explain: "Ví dụ: một nút có bóng đổ và nhãn động từ gợi ý rằng nó bấm được.",
  },
  {
    id: "gestalt",
    prompt: "Đâu là một nguyên tắc Gestalt?",
    options: ["Định luật Moore", "Định luật Murphy", "Gần nhau (Proximity)", "Định luật Parkinson"],
    answer: 2,
    explain: "Các phần tử đặt gần nhau được hiểu là cùng một nhóm. Nhãn nên đặt sát ô nhập của nó.",
  },
  {
    id: "serif",
    prompt: "Kiểu chữ trong hình thuộc nhóm nào?",
    visual: {
      type: "svg",
      alt: "Chữ Aa với các nét chân ở đầu và cuối nét",
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" rx="16" fill="#ffffff"/><text x="160" y="128" text-anchor="middle" font-family="Georgia, 'Times New Roman', 'Noto Serif', serif" font-size="112" fill="#111827">Aa</text></svg>`,
    },
    options: ["Sans-serif", "Serif", "Monospace", "Script"],
    answer: 1,
    explain: "Serif có các nét chân nhỏ ở đầu và cuối nét chữ, ví dụ Georgia và Times New Roman.",
  },
];

/** Khung điện thoại dùng chung cho hình minh hoạ A/B. */
const frame = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" font-family="Inter, 'Segoe UI', Roboto, Arial, sans-serif"><rect width="320" height="240" rx="16" fill="#ffffff"/><rect x="0.5" y="0.5" width="319" height="239" rx="15.5" fill="none" stroke="#E5E7EB"/>${body}</svg>`;

const field = (x, y, w, label, labelGap = 8) =>
  `<text x="${x}" y="${y}" font-size="13" fill="#374151">${label}</text><rect x="${x}" y="${y + labelGap}" width="${w}" height="30" rx="8" fill="#ffffff" stroke="#9CA3AF"/>`;

/**
 * A hay B. Server tự xáo vị trí: mỗi cặp có một hình tốt (`good`) và một hình chưa tốt (`bad`).
 * @type {Array<{ id: string, prompt: string, principle: string, explain: string, good: string, bad: string, goodAlt: string, badAlt: string }>}
 */
export const AB = [
  {
    id: "contrast",
    prompt: "Nút nào dễ đọc hơn?",
    principle: "Tương phản màu",
    explain: "Chữ trắng trên nền xanh đậm đạt khoảng 6.7:1. Chữ xám nhạt trên nền trắng chỉ khoảng 1.7:1, dưới chuẩn 4.5:1.",
    goodAlt: "Nút xanh đậm, chữ trắng 'Đăng ký ngay'",
    badAlt: "Nút trắng viền nhạt, chữ xám rất nhạt 'Đăng ký ngay'",
    good: frame(
      `<text x="32" y="64" font-size="18" font-weight="700" fill="#111827">Khoá học UI/UX</text><text x="32" y="90" font-size="13" fill="#4B5563">Bắt đầu hành trình thiết kế của bạn</text><rect x="32" y="140" width="256" height="48" rx="12" fill="#1D4ED8"/><text x="160" y="170" text-anchor="middle" font-size="16" font-weight="600" fill="#ffffff">Đăng ký ngay</text>`,
    ),
    bad: frame(
      `<text x="32" y="64" font-size="18" font-weight="700" fill="#111827">Khoá học UI/UX</text><text x="32" y="90" font-size="13" fill="#4B5563">Bắt đầu hành trình thiết kế của bạn</text><rect x="32.5" y="140.5" width="255" height="47" rx="12" fill="#ffffff" stroke="#EEEEEE"/><text x="160" y="170" text-anchor="middle" font-size="16" font-weight="600" fill="#C8C8C8">Đăng ký ngay</text>`,
    ),
  },
  {
    id: "alignment",
    prompt: "Form nào trông gọn gàng, dễ quét hơn?",
    principle: "Căn lề",
    explain: "Khi nhãn và ô nhập thẳng một đường lề trái, mắt chỉ cần đi theo một trục dọc nên quét form nhanh hơn.",
    goodAlt: "Ba ô nhập cùng thẳng lề trái",
    badAlt: "Ba ô nhập lệch lề mỗi ô một kiểu",
    good: frame(`${field(40, 40, 240, "Họ và tên")}${field(40, 104, 240, "Email")}${field(40, 168, 240, "Số điện thoại")}`),
    bad: frame(`${field(40, 40, 240, "Họ và tên")}${field(72, 104, 200, "Email")}${field(24, 168, 220, "Số điện thoại")}`),
  },
  {
    id: "hierarchy",
    prompt: "Thẻ bài viết nào có phân cấp thông tin rõ hơn?",
    principle: "Phân cấp thị giác",
    explain: "Tiêu đề to và đậm, phụ đề xám nhỏ hơn, nội dung thường: người đọc biết ngay đâu là điều quan trọng nhất.",
    goodAlt: "Tiêu đề to đậm, phụ đề xám, nội dung nhỏ",
    badAlt: "Tiêu đề, phụ đề và nội dung cùng cỡ chữ và độ đậm",
    good: frame(
      `<rect x="24" y="24" width="272" height="72" rx="10" fill="#DBEAFE"/><text x="24" y="132" font-size="22" font-weight="700" fill="#111827">10 mẹo chọn màu</text><text x="24" y="156" font-size="13" fill="#6B7280">Thiết kế · 5 phút đọc</text><text x="24" y="188" font-size="14" fill="#374151">Bắt đầu với một màu chính và</text><text x="24" y="208" font-size="14" fill="#374151">các sắc độ của nó…</text>`,
    ),
    bad: frame(
      `<rect x="24" y="24" width="272" height="72" rx="10" fill="#DBEAFE"/><text x="24" y="132" font-size="14" fill="#374151">10 mẹo chọn màu</text><text x="24" y="156" font-size="14" fill="#374151">Thiết kế · 5 phút đọc</text><text x="24" y="188" font-size="14" fill="#374151">Bắt đầu với một màu chính và</text><text x="24" y="208" font-size="14" fill="#374151">các sắc độ của nó…</text>`,
    ),
  },
  {
    id: "proximity",
    prompt: "Ở form nào, nhãn rõ ràng thuộc về ô nhập của nó?",
    principle: "Gần nhau (Gestalt)",
    explain: "Nhãn đặt sát ô của nó và cách xa ô phía trên, nên mắt tự gom nhãn với đúng ô nhập.",
    goodAlt: "Nhãn nằm sát ngay trên ô nhập của nó",
    badAlt: "Nhãn nằm xa ô của nó và sát ngay dưới ô phía trên, dễ hiểu nhầm",
    good: frame(`${field(40, 44, 240, "Mật khẩu", 6)}${field(40, 124, 240, "Nhập lại mật khẩu", 6)}`),
    bad: frame(
      `<text x="40" y="44" font-size="13" fill="#374151">Mật khẩu</text><rect x="40" y="76" width="240" height="30" rx="8" fill="#ffffff" stroke="#9CA3AF"/><text x="40" y="124" font-size="13" fill="#374151">Nhập lại mật khẩu</text><rect x="40" y="156" width="240" height="30" rx="8" fill="#ffffff" stroke="#9CA3AF"/>`,
    ),
  },
  {
    id: "buttons",
    prompt: "Hộp thoại nào cho thấy rõ hành động chính?",
    principle: "Thứ bậc nút bấm",
    explain: "Chỉ một nút nổi bật cho hành động chính. Hành động nguy hiểm (Xoá) dùng màu đỏ, nút Huỷ để nhẹ.",
    goodAlt: "Nút Huỷ dạng chữ, nút Xoá dự án màu đỏ nổi bật",
    badAlt: "Hai nút Huỷ và Xoá dự án giống hệt nhau",
    good: frame(
      `<text x="28" y="60" font-size="18" font-weight="700" fill="#111827">Xoá dự án này?</text><text x="28" y="88" font-size="13" fill="#4B5563">Bạn sẽ không khôi phục lại được.</text><text x="118" y="190" text-anchor="middle" font-size="15" font-weight="600" fill="#374151">Huỷ</text><rect x="168" y="164" width="124" height="40" rx="10" fill="#DC2626"/><text x="230" y="190" text-anchor="middle" font-size="15" font-weight="600" fill="#ffffff">Xoá dự án</text>`,
    ),
    bad: frame(
      `<text x="28" y="60" font-size="18" font-weight="700" fill="#111827">Xoá dự án này?</text><text x="28" y="88" font-size="13" fill="#4B5563">Bạn sẽ không khôi phục lại được.</text><rect x="28" y="164" width="124" height="40" rx="10" fill="#2563EB"/><text x="90" y="190" text-anchor="middle" font-size="15" font-weight="600" fill="#ffffff">Huỷ</text><rect x="168" y="164" width="124" height="40" rx="10" fill="#2563EB"/><text x="230" y="190" text-anchor="middle" font-size="15" font-weight="600" fill="#ffffff">Xoá dự án</text>`,
    ),
  },
  {
    id: "touch",
    prompt: "Thanh điều hướng nào dễ bấm trên điện thoại hơn?",
    principle: "Vùng chạm",
    explain: "Mỗi mục có vùng chạm khoảng 44 pt trở lên và có nhãn chữ, nên ngón tay khó bấm nhầm.",
    goodAlt: "Bốn mục điều hướng to, cách đều, có nhãn chữ",
    badAlt: "Bốn biểu tượng rất nhỏ dồn sát vào nhau",
    good: frame(
      `<rect x="16" y="150" width="288" height="72" rx="14" fill="#F3F4F6"/>${[0, 1, 2, 3]
        .map((i) => {
          const cx = 52 + i * 72;
          const labels = ["Trang chủ", "Tìm", "Khoá học", "Tôi"];
          return `<rect x="${cx - 26}" y="160" width="52" height="52" rx="12" fill="${i === 0 ? "#DBEAFE" : "#F3F4F6"}"/><circle cx="${cx}" cy="178" r="9" fill="${i === 0 ? "#1D4ED8" : "#6B7280"}"/><text x="${cx}" y="204" text-anchor="middle" font-size="10" fill="${i === 0 ? "#1D4ED8" : "#4B5563"}">${labels[i]}</text>`;
        })
        .join("")}`,
    ),
    bad: frame(
      `<rect x="16" y="150" width="288" height="72" rx="14" fill="#F3F4F6"/>${[0, 1, 2, 3]
        .map((i) => `<circle cx="${130 + i * 20}" cy="186" r="5" fill="${i === 0 ? "#1D4ED8" : "#6B7280"}"/>`)
        .join("")}`,
    ),
  },
];

/**
 * Đoán số đông (This or That): ai chọn giống số đông thì được điểm. Chủ đề đời thường để cả lớp làm quen nhau.
 * Mỗi lựa chọn có một emoji làm hình minh hoạ.
 * @type {Array<{ id: string, prompt: string, options: [{ emoji: string, label: string }, { emoji: string, label: string }] }>}
 */
export const POLLS = [
  { id: "trip", prompt: "Kỳ nghỉ mơ ước của bạn?", options: [{ emoji: "🏖️", label: "Ra biển" }, { emoji: "⛰️", label: "Lên núi" }] },
  { id: "drink", prompt: "Đồ uống ruột của bạn?", options: [{ emoji: "☕", label: "Cà phê" }, { emoji: "🧋", label: "Trà sữa" }] },
  { id: "time", prompt: "Bạn là người…", options: [{ emoji: "🐓", label: "Dậy sớm" }, { emoji: "🦉", label: "Cú đêm" }] },
  { id: "pet", prompt: "Team thú cưng nào?", options: [{ emoji: "🐶", label: "Team chó" }, { emoji: "🐱", label: "Team mèo" }] },
  { id: "food", prompt: "Bữa sáng chọn món nào?", options: [{ emoji: "🍜", label: "Phở" }, { emoji: "🥖", label: "Bánh mì" }] },
  { id: "weekend", prompt: "Cuối tuần lý tưởng là…", options: [{ emoji: "🎒", label: "Đi chơi" }, { emoji: "🛌", label: "Ngủ nướng" }] },
  { id: "taste", prompt: "Khẩu vị của bạn?", options: [{ emoji: "🍰", label: "Ăn ngọt" }, { emoji: "🌶️", label: "Ăn cay" }] },
  { id: "season", prompt: "Mùa yêu thích?", options: [{ emoji: "☀️", label: "Mùa hè" }, { emoji: "❄️", label: "Mùa đông" }] },
  { id: "chat", prompt: "Liên lạc với bạn bè bằng…", options: [{ emoji: "💬", label: "Nhắn tin" }, { emoji: "📞", label: "Gọi điện" }] },
  { id: "movie", prompt: "Tối nay xem phim gì?", options: [{ emoji: "💥", label: "Hành động" }, { emoji: "😂", label: "Hài hước" }] },
  { id: "music", prompt: "Đi hát karaoke, bạn là…", options: [{ emoji: "🎤", label: "Ca sĩ chính" }, { emoji: "👏", label: "Khán giả" }] },
  { id: "mode", prompt: "Điện thoại của bạn để…", options: [{ emoji: "🌙", label: "Dark mode" }, { emoji: "☀️", label: "Light mode" }] },
];

/**
 * Đuổi hình bắt chữ: nhìn emoji, đoán thành ngữ, tên phim hoặc món ăn.
 * @type {Array<{ id: string, category: string, emoji: string, options: string[], answer: number, explain?: string }>}
 */
export const REBUS = [
  { id: "ech", category: "Thành ngữ", emoji: "🐸🕳️", options: ["Ếch ngồi đáy giếng", "Cá chậu chim lồng", "Nước đổ đầu vịt", "Mèo mù vớ cá rán"], answer: 0, explain: "Ếch ngồi đáy giếng: hiểu biết hạn hẹp mà tưởng mình biết nhiều." },
  { id: "dan", category: "Thành ngữ", emoji: "🎸👂🐃", options: ["Cưỡi ngựa xem hoa", "Đàn gảy tai trâu", "Vẽ rắn thêm chân", "Nước chảy đá mòn"], answer: 1, explain: "Đàn gảy tai trâu: nói điều hay với người không hiểu, không muốn nghe." },
  { id: "vit", category: "Thành ngữ", emoji: "💧🦆", options: ["Nước chảy đá mòn", "Mèo mù vớ cá rán", "Nước đổ đầu vịt", "Cá lớn nuốt cá bé"], answer: 2, explain: "Nước đổ đầu vịt: khuyên bảo mấy cũng không vào." },
  { id: "ngua", category: "Thành ngữ", emoji: "🏇🌸", options: ["Đàn gảy tai trâu", "Cưỡi ngựa xem hoa", "Ếch ngồi đáy giếng", "Chậm mà chắc"], answer: 1, explain: "Cưỡi ngựa xem hoa: xem qua loa, không kỹ." },
  { id: "ran", category: "Thành ngữ", emoji: "✏️🐍🦶", options: ["Vẽ rắn thêm chân", "Rắn mất đầu", "Nước đổ đầu vịt", "Cá chậu chim lồng"], answer: 0, explain: "Vẽ rắn thêm chân: làm thừa, khiến mọi thứ tệ hơn." },
  { id: "meo", category: "Thành ngữ", emoji: "🐱🙈🐟", options: ["Cá lớn nuốt cá bé", "Mèo mù vớ cá rán", "Chó cắn áo rách", "Ếch ngồi đáy giếng"], answer: 1, explain: "Mèo mù vớ cá rán: gặp may một cách tình cờ." },
  { id: "da", category: "Thành ngữ", emoji: "💧💧💧🪨", options: ["Nước chảy đá mòn", "Nước đổ đầu vịt", "Cưỡi ngựa xem hoa", "Vẽ rắn thêm chân"], answer: 0, explain: "Nước chảy đá mòn: kiên trì thì việc khó cũng thành." },
  { id: "ca", category: "Thành ngữ", emoji: "🦈🐟", options: ["Cá chậu chim lồng", "Cá lớn nuốt cá bé", "Mèo mù vớ cá rán", "Nước đổ đầu vịt"], answer: 1, explain: "Cá lớn nuốt cá bé: kẻ mạnh lấn át kẻ yếu." },
  { id: "lion", category: "Phim", emoji: "🦁👑", options: ["Vua sư tử", "Madagascar", "Zootopia", "Kung Fu Panda"], answer: 0 },
  { id: "frozen", category: "Phim", emoji: "❄️👸⛄", options: ["Lọ Lem", "Nữ hoàng băng giá", "Người đẹp và quái vật", "Moana"], answer: 1 },
  { id: "titanic", category: "Phim", emoji: "🚢🧊💔", options: ["Cướp biển vùng Caribbean", "Titanic", "Đi tìm Nemo", "Moana"], answer: 1 },
  { id: "panda", category: "Phim", emoji: "🐼🥋", options: ["Zootopia", "Vua sư tử", "Kung Fu Panda", "Madagascar"], answer: 2 },
  { id: "spider", category: "Phim", emoji: "🕷️🧑", options: ["Người Dơi", "Người Sắt", "Người Nhện", "Siêu Nhân"], answer: 2 },
  { id: "nemo", category: "Phim", emoji: "🔎🐠", options: ["Đi tìm Nemo", "Moana", "Nàng tiên cá", "Titanic"], answer: 0 },
  { id: "pho", category: "Món ăn", emoji: "🍜🐄", options: ["Bún chả", "Phở bò", "Hủ tiếu", "Mì Quảng"], answer: 1 },
  { id: "comga", category: "Món ăn", emoji: "🍚🐔", options: ["Cơm tấm", "Cơm gà", "Xôi gà", "Cháo gà"], answer: 1 },
];
