// lib/textlen.ts
// 文字数カウント（半角=1u / 全角=2u）用のユーティリティ。React依存なし。

const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\uFF00-\uFFEF]/u;
const FULLWIDTH_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\u1100-\u11FF\uAC00-\uD7AF\uFF00-\uFFEF]/u;

// ユニット上限：半角46u（= 全角23文字相当）
const MAX_UNITS = 46;

export function sanitizeMessage(input: unknown): string {
  if (typeof input !== 'string') return '';
  // 制御文字除去＋空白正規化
  let s = input.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
  return s;
}

export function hasCJK(s: string): boolean {
  return CJK_RE.test(s);
}

// 1 文字ごとのユニット数（半角=1 / 全角系=2 くらいの緩い判定）
function charUnits(ch: string): number {
  // 1コードポイントずつ見る
  const code = ch.codePointAt(0)!;
  // ASCII～Latin拡張などは 1u 扱い
  if (code <= 0x00ff) return 1;
  // 全角/東アジア系は 2u 扱い
  return 2;
}

// 合計ユニット数を返す
export function effectiveLengthUnits(s: string): number {
  let u = 0;
  for (const ch of s) {
    u += charUnits(ch);
  }
  return u;
}

// 上限ユニット。今回は固定 46u（半角46/全角23）
export function maxUnitsFor(_s: string): number {
  return MAX_UNITS;
}

// ユニット上限に収まるようにトリム
export function trimToUnits(s: string, limitUnits = MAX_UNITS): string {
  let used = 0;
  let out = '';
  for (const ch of s) {
    const u = charUnits(ch);
    if (used + u > limitUnits) break;
    out += ch;
    used += u;
  }
  return out;
}
