// Chép hình emoji 3D (Microsoft Fluent Emoji, giấy phép MIT) mà trò chơi dùng vào public/emoji
// và sinh bảng tra src/lib/emoji-files.ts. Chạy lại mỗi khi thêm emoji mới vào nội dung hoặc giao diện:
//   npm run emoji
// Nguồn hình: gói npm @lobehub/fluent-emoji-3d. Nếu chưa có trong node_modules, script tự tải về thư mục tạm.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = "@lobehub/fluent-emoji-3d@1.1.0";
const OUT = path.join(ROOT, "public", "emoji");
const MAP = path.join(ROOT, "src", "lib", "emoji-files.ts");
const SOURCES = ["shared", "src"];

function assetsDir() {
  const local = path.join(ROOT, "node_modules", "@lobehub", "fluent-emoji-3d", "assets");
  if (existsSync(local)) return local;
  const dir = mkdtempSync(path.join(tmpdir(), "fluent-emoji-"));
  const file = execFileSync("npm", ["pack", PACKAGE, "--silent", "--registry=https://registry.npmjs.org/"], { cwd: dir, encoding: "utf8" }).trim().split("\n").pop();
  execFileSync("tar", ["-xzf", file], { cwd: dir });
  return path.join(dir, "package", "assets");
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (/\.(js|ts|tsx)$/.test(name) && full !== MAP) files.push(full);
  }
  return files;
}

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const used = new Set();
for (const file of SOURCES.flatMap((dir) => walk(path.join(ROOT, dir)))) {
  for (const { segment } of segmenter.segment(readFileSync(file, "utf8"))) {
    if (/\p{Extended_Pictographic}/u.test(segment)) used.add(segment);
  }
}

const hex = (text) => [...text].map((char) => char.codePointAt(0).toString(16)).join("-");
const assets = assetsDir();
const available = new Set(readdirSync(assets).map((name) => name.replace(/\.webp$/, "")));
const candidates = (emoji) => {
  const full = hex(emoji);
  const bare = hex(emoji.replace(/️/g, ""));
  return [full, bare, `${bare}-fe0f`];
};

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const map = {};
const missing = [];
for (const emoji of [...used].sort()) {
  const code = candidates(emoji).find((c) => available.has(c));
  if (!code) {
    missing.push(emoji);
    continue;
  }
  copyFileSync(path.join(assets, `${code}.webp`), path.join(OUT, `${code}.webp`));
  map[emoji] = code;
  const bare = emoji.replace(/️/g, "");
  if (bare !== emoji) map[bare] = code;
}

writeFileSync(
  path.join(OUT, "LICENSE.txt"),
  `Emoji images: Microsoft Fluent Emoji (3D style), via the npm package ${PACKAGE}.
https://github.com/microsoft/fluentui-emoji

MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
);

const entries = Object.entries(map)
  .sort(([a], [b]) => (a < b ? -1 : 1))
  .map(([emoji, code]) => `  ${JSON.stringify(emoji)}: ${JSON.stringify(code)},`)
  .join("\n");
writeFileSync(
  MAP,
  `// Sinh tự động bởi scripts/emoji-assets.mjs (npm run emoji). Không sửa tay.
// Emoji → tên file hình 3D trong public/emoji. Emoji không có ở đây thì hiện bằng phông chữ của máy.
export const EMOJI_FILES: Record<string, string> = {
${entries}
};
`,
);

console.log(`Đã chép ${new Set(Object.values(map)).size} hình vào public/emoji.`);
if (missing.length) console.log(`Không có hình 3D (hiện bằng phông chữ): ${missing.join(" ")}`);
