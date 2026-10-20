/** localStorage an toàn: trình duyệt ẩn danh hoặc chặn bộ nhớ thì bỏ qua. */
export function load<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bỏ qua */
  }
}

export function remove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* bỏ qua */
  }
}

export const hostKeyFor = (pin: string) => `uiux:host:${pin}`;
export const playerKeyFor = (pin: string) => `uiux:player:${pin}`;
export const LAST_NAME_KEY = "uiux:name";
