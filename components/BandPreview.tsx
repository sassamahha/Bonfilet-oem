// components/BandPreview.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  message: string;
  bodyColor: string;
  textColor: string;
  /** 親幅フィット時の最大幅（px or CSS長さ） */
  maxWidth?: number | string;
  /** 'width' = 親幅にフィット（推奨） / 'height' = 高さ固定 */
  fit?: 'width' | 'height';
  /** fit='height'時のみ使用 */
  height?: number;
  /** フレーム背景色（プレビューの“背面グレー”） */
  frameBg?: string;
  /** フレームの上下パディング（数値ならpx扱い/CSS長さ可） */
  framePadY?: number | string;
  /** フレームの左右パディング（数値ならpx扱い/CSS長さ可） */
  framePadX?: number | string;
  /** バンドのアスペクト比（既定 19/3） */
  aspect?: [number, number];
  className?: string;
};

/* ====== このファイル内で自己完結するテキストユーティリティ ====== */
/** 制御文字を除去してスペース正規化 */
function sanitizeLocal(s: string): string {
  return (s ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, '');
}

/** 全角(=2)・半角(=1)のユニット長 */
function unitsOfLocal(s: string): number {
  let u = 0;
  for (const ch of s) {
    // CJK/全角判定
    if (/[\u3000-\u9FFF\u3040-\u30FF\uFF00-\uFFEF]/.test(ch)) u += 2;
    else u += 1;
  }
  return u;
}

/** ユニット上限で安全に切り詰め */
function clampToUnitsLocal(s: string, limit: number): string {
  let u = 0;
  let out = '';
  for (const ch of s) {
    const add = /[\u3000-\u9FFF\u3040-\u30FF\uFF00-\uFFEF]/.test(ch) ? 2 : 1;
    if (u + add > limit) break;
    u += add;
    out += ch;
  }
  return out;
}

/** CJK を含むか */
function hasCJKLocal(s: string): boolean {
  return /[\u3000-\u9FFF\u3040-\u30FF\uFF00-\uFFEF]/.test(s);
}
/* ================================================================ */

export default function BandPreview({
  message,
  bodyColor,
  textColor,
  maxWidth = '100%',
  fit = 'width',
  height = 64,
  frameBg = '#f3f4f6',
  framePadY = 'clamp(40px, 10vw, 60px)',
  framePadX = 16,
  aspect = [19, 3], // ← 19:3（細長すぎない見え方）
  className
}: Props) {
  // バンドの仮想座標
  const VB_W = 1900;
  const VB_H = 100; // 19:3 に合わせた見栄え用の高さ

  // テキスト制約（半角=1・全角=2 で46u上限）
  const LIMIT_UNITS = 46;

  // 入力のサニタイズ＆クランプ
  const sanitized = useMemo(() => sanitizeLocal(message), [message]);
  const trimmed = useMemo(
    () => clampToUnitsLocal(sanitized, LIMIT_UNITS),
    [sanitized]
  );
  const isCJK = useMemo(() => hasCJKLocal(trimmed), [trimmed]);

  // レイアウトトークン
  const BAND_INNER_PAD_Y = 15;
  const BAND_INNER_PAD_X = 24;
  const TEXT_PAD_X = 22;
  const TEXT_PAD_Y = 10;
  const TEXT_BASELINE_ADJ = 2;
  const TARGET_FILL = 0.80;
  const MIN_FONT = 14;
  const MAX_FONT = 140;

  const textRef = useRef<SVGTextElement>(null);
  const [fontSize, setFontSize] = useState<number>(48);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const bandW = VB_W;
    const bandH = VB_H;

    const usableW =
      (bandW - BAND_INNER_PAD_X * 2 - TEXT_PAD_X * 2) * TARGET_FILL;
    const usableH = bandH - BAND_INNER_PAD_Y * 2 - TEXT_PAD_Y * 2;

    let fs = Math.min(Math.max(fontSize, MIN_FONT), MAX_FONT);
    fs = Math.min(fs, Math.max(MIN_FONT, usableH));

    let guard = 0;
    while (guard++ < 7) {
      el.setAttribute('font-size', String(fs));
      const w = el.getBBox().width || 0;
      if (!w) break;

      if (w > usableW * 1.01 && fs > MIN_FONT) {
        fs = Math.max(MIN_FONT, fs * (usableW / w) * 0.98);
        fs = Math.min(fs, usableH);
        continue;
      }
      if (w < usableW * 0.85 && fs < MAX_FONT) {
        fs = Math.min(MAX_FONT, fs * (usableW / w) * 1.02, usableH);
        continue;
      }
      break;
    }
    setFontSize(fs);
  }, [trimmed, bodyColor, textColor]); // 文字・色が変わるたび再計算

  const bandFill = bodyColor || '#000';
  const textFill = textColor || '#fff';

  // 外側（フレーム）スタイル
  const toCss = (v: number | string) => (typeof v === 'number' ? `${v}px` : v);

  const [AR_W, AR_H] = aspect;
  const bandBoxStyle: React.CSSProperties =
    fit === 'width'
      ? {
          width: '100%',
          maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
          aspectRatio: `${AR_W} / ${AR_H}`,
          marginInline: 'auto'
        }
      : {
          height: `${height}px`,
          aspectRatio: `${AR_W} / ${AR_H}`,
          maxWidth: '100%',
          marginInline: 'auto'
        };

  return (
    <div
      className={className}
      style={{
        background: frameBg,
        paddingBlock: toCss(framePadY),
        paddingInline: toCss(framePadX)
      }}
    >
      <div style={bandBoxStyle} className="w-full">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label="Band preview"
          className="block w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* バンド（角丸・枠線なし） */}
          <rect x={0} y={0} width={VB_W} height={VB_H} fill={bandFill} />

          {/* 中央テキスト */}
          <text
            ref={textRef}
            x={VB_W / 2}
            y={VB_H / 2 + TEXT_BASELINE_ADJ}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textFill}
            fontSize={fontSize}
            style={{
              fontFamily:
                `'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',Inter,'Segoe UI',system-ui,-apple-system,Arial,sans-serif`,
              fontWeight: 700,
              letterSpacing: isCJK ? '0.04em' : '0.06em',
              paintOrder: 'stroke',
              stroke: 'rgba(0,0,0,0.08)',
              strokeWidth: 1,
              textRendering: 'geometricPrecision'
            }}
          >
            {trimmed}
          </text>
        </svg>
      </div>
    </div>
  );
}
