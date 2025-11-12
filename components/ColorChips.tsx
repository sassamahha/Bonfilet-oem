'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  CSSProperties,
} from 'react';

/* ========== utils ========== */
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));

const normHex = (hex: string) => {
  if (!hex) return '#000000';
  let v = hex.trim();
  if (v[0] !== '#') v = `#${v}`;
  if (/^#([0-9a-f]{3})$/i.test(v)) {
    const m = v.slice(1);
    v = '#' + m.split('').map((c) => c + c).join('');
  }
  return /^#([0-9a-f]{6})$/i.test(v) ? v.toUpperCase() : '#000000';
};

function hexToRgb(hex: string) {
  const v = normHex(hex).slice(1);
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()
  );
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/* ========== props ========== */
type Props = {
  label: string;
  value: string;                  // current HEX
  onChange: (hex: string) => void;
  /** 先頭から最大9色を丸ボタンとして表示。10個目は「＋」＝円環 */
  quick: string[];
  size?: number;                  // chip diameter px (default 28)
};

/* ========== component ========== */
export default function ColorChips({ label, value, onChange, quick, size = 28 }: Props) {
  const current = normHex(value);
  const chips = useMemo(() => (quick ?? []).slice(0, 9).map(normHex), [quick]);

  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const plusBtnRef = useRef<HTMLButtonElement | null>(null);

  const openWheel = () => {
    setAnchor(plusBtnRef.current?.getBoundingClientRect() ?? null);
    setOpen(true);
  };

  const pick = (hex: string) => {
    onChange(normHex(hex));
    setOpen(false);
  };

  const d = `${size}px`;
  const circleBase =
    'inline-flex shrink-0 items-center justify-center rounded-full border border-slate-300 focus:outline-none';
  const circleStyle: CSSProperties = { width: d, height: d }; // aspect-square 実現

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-slate-600">{label}</div>

      <div className="flex flex-wrap gap-3">
        {chips.map((hex, i) => (
          <button
            key={i}
            title={hex}
            onClick={() => onChange(hex)}
            className={`${circleBase} p-0`}
            style={{
              ...circleStyle,
              backgroundColor: hex,
              boxShadow: current === hex ? '0 0 0 3px rgba(59,130,246,.55)' : undefined,
            }}
          />
        ))}
        <button
          ref={plusBtnRef}
          title="Custom color"
          onClick={openWheel}
          className={`${circleBase} p-0 text-slate-600 bg-white`}
          style={circleStyle}
        >
          ＋
        </button>
      </div>

      {open && (
        <WheelPopup
          anchor={anchor}
          initial={current}
          onCancel={() => setOpen(false)}
          onOk={pick}
        />
      )}
    </div>
  );
}

/* ========== wheel popup ========== */
function WheelPopup({
  anchor,
  initial,
  onCancel,
  onOk,
}: {
  anchor: DOMRect | null;
  initial: string;
  onCancel: () => void;
  onOk: (hex: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const initHSV = (() => {
    const { r, g, b } = hexToRgb(initial);
    const { h, s, v } = rgbToHsv(r, g, b);
    return { h, s, v: v || 1 };
  })();

  const [hsv, setHSV] = useState(initHSV);

  // close on outside / Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    const onClick = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onCancel]);

  // draw wheel + handle
  const draw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const size = c.width;
    const cx = size / 2, cy = size / 2, r = size / 2 - 2;

    // wheel
    const image = ctx.createImageData(size, size);
    const data = image.data;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const idx = (y * size + x) * 4;
        if (dist > r) { data[idx + 3] = 0; continue; }
        const angle = Math.atan2(dy, dx);
        const hh = (angle / (2 * Math.PI) + 1) % 1;
        const ss = clamp(dist / r, 0, 1);
        const { r: R, g: G, b: B } = hsvToRgb(hh, ss, hsv.v);
        data[idx] = R; data[idx + 1] = G; data[idx + 2] = B; data[idx + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);

    // handle marker
    const theta = hsv.h * 2 * Math.PI;
    const rr = r * hsv.s;
    const hx = cx + rr * Math.cos(theta);
    const hy = cy + rr * Math.sin(theta);
    ctx.beginPath();
    ctx.arc(hx, hy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(15,23,42,.7)';
    ctx.stroke();
  };

  // redraw when V / H / S changes
  useEffect(() => {
    const id = requestAnimationFrame(() => draw());
    return () => cancelAnimationFrame(id);
  }, [hsv.h, hsv.s, hsv.v]);

  // mount canvas
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const size = 280; // px
    c.width = size;  c.height = size;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    draw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // wheel drag (pointer events)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const onPointer = (e: PointerEvent) => {
      const rect = c.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      const cx = c.width / 2, cy = c.height / 2, r = c.width / 2 - 2;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) return;
      const angle = Math.atan2(dy, dx);
      const h = (angle / (2 * Math.PI) + 1) % 1;
      const s = clamp(dist / r, 0, 1);
      setHSV((p) => ({ ...p, h, s }));
    };

    const down = (e: PointerEvent) => {
      c.setPointerCapture(e.pointerId);
      onPointer(e);
    };
    const move = (e: PointerEvent) => { if (e.pressure !== 0) onPointer(e); };
    const up = (e: PointerEvent) => { try { c.releasePointerCapture(e.pointerId); } catch {} };

    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    return () => {
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up);
      c.removeEventListener('pointercancel', up);
    };
  }, []);

  // value slider (vertical)
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.style.background = `linear-gradient(to bottom, #ffffff, #000000)`;
  }, []);

  const slideAt = (clientY: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = clamp((clientY - rect.top) / rect.height, 0, 1);
    setHSV((p) => ({ ...p, v: 1 - t }));
  };

  const styleWrap: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    background: 'transparent',
  };
  const stylePopup: CSSProperties = {
    position: 'fixed',
    zIndex: 61,
    top: (anchor?.bottom ?? 0) + 8,
    left: (anchor?.left ?? 0),
    background: '#fff',
    boxShadow: '0 10px 30px rgba(0,0,0,.15)',
    borderRadius: 12,
    padding: 14,
    border: '1px solid rgba(15,23,42,.08)',
  };

  const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
  const live = rgbToHex(r, g, b);

  return (
    <>
      <div ref={overlayRef} style={styleWrap} />
      <div style={stylePopup} role="dialog" aria-modal="true">
        <div className="flex items-center gap-3">
          <canvas
            ref={canvasRef}
            style={{ display: 'block', cursor: 'crosshair' }}
          />
          <div
            ref={sliderRef}
            onPointerDown={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              el.setPointerCapture(e.pointerId);
              slideAt(e.clientY);
            }}
            onPointerMove={(e) => {
              // pressure==0 はドラッグしてない移動（マウスオーバー）
              if (e.pressure !== 0) slideAt(e.clientY);
            }}
            onPointerUp={(e) => {
              try { (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId); } catch {}
            }}
            className="h-[220px] w-[14px] rounded-md border border-slate-200"
            style={{ cursor: 'ns-resize' }}
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span
              className="inline-block h-4 w-4 rounded-sm border border-slate-300"
              style={{ background: live }}
            />
            <span>{live}</span>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-slate-300 px-3 py-1 text-slate-700"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-slate-900 px-3 py-1 text-white"
              onClick={() => onOk(live)}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
