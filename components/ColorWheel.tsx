// components/ColorWheel.tsx
'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {clamp, hexToHsv, hsvToHex} from '@/lib/color';

type WheelProps = {
  value: string;                 // 現在のHEX
  onChange: (hex: string) => void;
  size?: number;                 // 直径(px)
  className?: string;
};

/**
 * 角度=色相H、半径=彩度S、右の縦スライダー=明度V
 * 背景は conic-gradient + radial-gradient の合成で軽量表示。
 */
export default function ColorWheel({ value, onChange, size = 220, className }: WheelProps) {
  const hsvInit = useMemo(() => hexToHsv(value) ?? {h: 0, s: 0, v: 1}, [value]);
  const [h, setH] = useState(hsvInit.h);
  const [s, setS] = useState(hsvInit.s);
  const [v, setV] = useState(hsvInit.v);

  // value変更（外部から）の同期
  useEffect(() => {
    const hsv = hexToHsv(value);
    if (hsv) { setH(hsv.h); setS(hsv.s); setV(hsv.v); }
  }, [value]);

  // Wheelのスタイル（Vは黒オーバーレイで表現）
  const wheelStyle: React.CSSProperties = {
    width: size, height: size, borderRadius: '9999px',
    position: 'relative',
    background: `
      radial-gradient(circle at center, #fff 0%, rgba(255,255,255,0) 60%),
      conic-gradient(
        red, yellow, lime, cyan, blue, magenta, red
      )
    `,
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.08)'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: '9999px',
    background: `rgba(0,0,0,${clamp(1 - v, 0, 1)})`,
    pointerEvents: 'none'
  };

  const knob = useMemo(() => {
    const r = (size / 2) * s;
    const rad = (h - 90) * (Math.PI / 180); // 上向き0°
    return {
      x: size / 2 + r * Math.cos(rad),
      y: size / 2 + r * Math.sin(rad)
    };
  }, [h, s, size]);

  // ポインタ操作
  const dragging = useRef(false);
  const onPointer = (e: React.PointerEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = e.clientX - cx;
    const y = e.clientY - cy;
    const angle = Math.atan2(y, x);             // −π..π (右が0°)
    const deg = (angle * 180) / Math.PI;        // 右0° 下90°
    const dist = Math.sqrt(x * x + y * y);
    const sNew = clamp(dist / (size / 2));
    // 上を0°にしたいので +90
    const hNew = (deg + 90 + 360) % 360;

    setH(hNew);
    setS(sNew);
    onChange(hsvToHex(hNew, sNew, v));
  };

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onPointer(e);
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragging.current) onPointer(e);
  };
  const onUp = (e: React.PointerEvent) => {
    dragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // 明度スライダー
  const sliderId = useMemo(() => `v-${Math.random().toString(36).slice(2,8)}`, []);
  const gradientForV = useMemo(() => {
    const start = hsvToHex(h, s, 0);
    const end   = hsvToHex(h, s, 1);
    return `linear-gradient(180deg, ${end}, ${start})`;
  }, [h, s]);

  return (
    <div className={className} style={{display:'flex', gap:12, alignItems:'center'}}>
      <div
        style={wheelStyle}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
      >
        <div style={overlayStyle} />
        {/* knob */}
        <div
          style={{
            position:'absolute',
            left: knob.x - 8,
            top: knob.y - 8,
            width:16, height:16,
            borderRadius:'9999px',
            background:'#fff',
            boxShadow:'0 0 0 2px #000, inset 0 0 0 2px #fff'
          }}
        />
      </div>

      {/* V slider */}
      <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:8}}>
        <label htmlFor={sliderId} style={{fontSize:12, color:'#6b7280'}}>V</label>
        <div style={{
          height: size, width: 14, borderRadius: 8,
          background: gradientForV, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.1)'
        }}>
          <input
            id={sliderId}
            type="range"
            min={0} max={100} value={Math.round(v*100)}
            onChange={(e) => {
              const vv = clamp(Number(e.target.value)/100);
              setV(vv);
              onChange(hsvToHex(h, s, vv));
            }}
            style={{
              appearance:'none', writingMode:'bt-lr',
              width: 14, height: size, margin:0, opacity:0, cursor:'pointer'
            }}
          />
        </div>
      </div>
    </div>
  );
}
