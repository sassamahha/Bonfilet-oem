'use client';

import {useMemo, useState} from 'react';

type Props = {
  label: string;
  /** 現在値（色キー or #HEX） */
  value: string;
  /** 変更ハンドラ（色キー or #HEX を返す） */
  onChange: (v: string) => void;
  /** 色名→HEX のマップ（data/colors.yaml を読み込んだもの） */
  colors: Record<string, string>;
  /** プレースホルダ（未選択時） */
  placeholder?: string;
};

export default function ColorSelect({label, value, onChange, colors, placeholder}: Props) {
  // value が色キーか HEX かで表示を整える
  const {resolvedHex, currentKey} = useMemo(() => {
    const v = (value ?? '').trim();
    const isHex = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
    if (isHex) return {resolvedHex: v, currentKey: ''};
    const hex = colors[v];
    return {resolvedHex: hex ?? '', currentKey: hex ? v : ''};
  }, [value, colors]);

  // 「カスタムHEX」を開くトグル
  const [customMode, setCustomMode] = useState<boolean>(() => {
    const v = (value ?? '').trim();
    return /^#/.test(v) && !currentKey;
  });

  return (
    <div className="w-full">
      <div className="mb-1 text-sm text-slate-600">{label}</div>

      {/* プレビューのスウォッチ */}
      <div className="mb-2 flex items-center gap-2">
        <div
          className="h-5 w-5 rounded border border-slate-300"
          style={{background: resolvedHex || '#ffffff'}}
          aria-label="color swatch"
          title={resolvedHex || '—'}
        />
        <span className="text-xs text-slate-500">
          {currentKey ? `${currentKey} (${colors[currentKey]})` : resolvedHex || '—'}
        </span>
      </div>

      {/* モード切替：プリセット or カスタムHEX */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCustomMode(false)}
          className={`rounded px-2 py-1 text-sm ${
            !customMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          プリセット
        </button>
        <button
          type="button"
          onClick={() => setCustomMode(true)}
          className={`rounded px-2 py-1 text-sm ${
            customMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
          }`}
        >
          カスタムHEX
        </button>
      </div>

      {/* 本体：セレクト or HEX入力 */}
      {!customMode ? (
        <select
          value={currentKey}
          onChange={(e) => onChange(e.target.value || '')}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2"
        >
          <option value="">{placeholder ?? '色を選択'}</option>
          {Object.entries(colors).map(([key, hex]) => (
            <option key={key} value={key}>
              {key} {hex}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 font-mono"
          placeholder="#000000"
          value={/^#/.test(value) ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={7}
        />
      )}
    </div>
  );
}
