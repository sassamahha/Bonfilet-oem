'use client';

import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Locale} from '@/lib/i18n';
import BandPreview from '@/components/BandPreview';
import ColorChips from '@/components/ColorChips';

type ColorsConfig = Record<string,string>;

type FormState = {
  messageText: string;
  bodyColor: string; // hex
  textColor: string; // hex
  qty: number;
  country: string;   // ISO2
};

type Quote = {
  subtotal: number; shipping: number; taxDuties: number;
  total: number;    currency: string;
  eta?: {from:string; to:string};
  validation?: {ok:boolean; errors?: string[]};
};

/** 便利関数 */
const hex = (s:string)=>s.toUpperCase();

/** 指定の“10色(うち最後はホイール)”に合わせたクイック配列(9色ぶん) */
const BODY_QUICK = [
  '#000000', '#FFFFFF', '#E74C3C', '#2962FF', '#F1C40F', '#27AE60',
].map(hex);

const TEXT_QUICK = [
  '#FFFFFF', '#000000', '#E74C3C', '#2962FF', '#F1C40F', '#27AE60',
].map(hex);

export default function ConfiguratorForm({
  colors,  // 使っていなくても互換のため受け取る
  locale,
}: {colors: ColorsConfig;  locale: Locale}) {

  const tOrder = useTranslations('order');
  const tQuote = useTranslations('quote');

  const [form,setForm] = useState<FormState>({
    messageText: 'ONE TEAM, ONE MESSAGE',
    bodyColor: '#000000',
    textColor: '#FFFFFF',
    qty: 30,
    country: (locale==='ja'?'JP':'US'),
  });

  const update = <K extends keyof FormState>(k:K)=> (v:FormState[K]) =>
    setForm(s=>({...s,[k]:v}));

  /** 見積り（ダミー連携のまま） */
  const [quote,setQuote] = useState<Quote|null>(null);
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState<string|null>(null);

  useEffect(()=>{
    const t = setTimeout(async ()=>{
      setLoading(true); setErr(null);
      try{
        const res = await fetch('/api/quote',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            items:[{ productType:'bonfilet',
                     messageText: form.messageText,
                     bodyColor: form.bodyColor,
                     textColor: form.textColor,
                     qty: form.qty }],
            shipTo:{country: form.country},
            currency: (locale==='ja'?'JPY':'USD'),
            locale
          })
        });
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const data:Quote = await res.json();
        setQuote(data);
      }catch(e:any){ setErr(e.message??'Quote failed'); setQuote(null); }
      finally{ setLoading(false); }
    },250);
    return ()=>clearTimeout(t);
  },[form.messageText, form.bodyColor, form.textColor, form.qty, form.country, locale]);

  const curFmt = useMemo(
    ()=> new Intl.NumberFormat(undefined,{style:'currency', currency: quote?.currency ?? (locale==='ja'?'JPY':'USD')}),
    [quote?.currency, locale]
  );

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_360px]">
      {/* 左側：フォーム */}
      <div className="space-y-6">
        <label className="block">
          <div className="mb-1 text-sm text-sleet-600">{tOrder('message')}</div>
          <input
            value={form.messageText}
            onChange={(e)=>update('messageText')(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder={tOrder('placeholder')}
            maxLength={46} // 半角想定。全角は実質23文字目で止める運用なら別途制御してOK
          />
          <div className="mt-1 text-xs text-slate-500">{tOrder('charsLeftUnits')}（半=1・全=2）</div>
        </label>

        {/* 10色（最後はホイール） */}
        <div className="grid grid-cols-2 gap-6">
          <ColorChips
            label={tOrder('bodyColor')}
            value={form.bodyColor}
            onChange={hex=>update('bodyColor')(hex)}
            quick={BODY_QUICK}
          />
          <ColorChips
            label={tOrder('textColor')}
            value={form.textColor}
            onChange={hex=>update('textColor')(hex)}
            quick={TEXT_QUICK}
          />
        </div>

        {/* プレビュー */}
        <div className="max-w-[720px]">
          <BandDiv>
            <BandPreview
              message={form.messageText}
              bodyColor={form.bodyColor}
              textColor={form.textColor}
              maxWidth={720}
              fit="width"
              className="my-2"
            />
          </BandDiv>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <div className="mb-1 text-sm text-slate-600">{tOrder('quantity')}</div>
            <input type="number" min={10} step={5}
              value={form.qty}
              onChange={(e)=>update('qty')(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <div className="mb-1 text-sm text-slate-600">{tOrder('arrival')}</div>
            <input
              value={form.country}
              onChange={(e)=>update('country')(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              maxLength={2}
              placeholder={locale==='ja'?'JP':'US'}
            />
          </label>
        </div>
      </div>

      {/* 右側：見積り */}
      <aside className="sticky top-8 h-max rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 text-sm font-medium text-slate-500">{tQuote('panelTitle')}</div>
        {loading && <div className="text-slate-500">{tQuote('updating')}</div>}
        {err && <div className="rounded-md bg-rose-50 p-2 text-sm text-rose-700">{err}</div>}
        {quote && (
          <div className="space-y-2 text-sm">
            <Row label={tQuote('subtotal')} val={curFmt.format(quote.subtotal)} />
            <Row label={tQuote('shipping')} val={curFmt.format(quote.shipping)} />
            <Row label={tQuote('tax')}      val={curFmt.format(quote.taxDuties)} />
            <hr />
            <Row label={tQuote('total')}    val={curFmt.format(quote.total)} strong />
            {quote.eta && <div className="mt-2 text-slate-600">{tQuote('eta',{from:quote.eta.from,to:quote.eta.to})}</div>}
            <button className="mt-3 w-full rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                    disabled={quote.validation && !quote.validation.ok}
                    onClick={()=>alert('Next: /api/checkout')}>{tQuote('checkout')}</button>
          </div>
        )}
        {!quote && !loading && !err && <div className="text-slate-500">{tQuote('empty')}</div>}
      </aside>
    </div>
  );
}

function Row({label,val, strong=false}:{label:string; val:string; strong?:boolean}){
  return (
    <div className="flex items-center justify-between">
      <span className={`text-slate-600 ${strong?'font-semibold text-slate-900':''}`}>{label}</span>
      <span className={`tabular-nums ${strong?'font-semibold text-slate-900':''}`}>{val}</span>
    </div>
  );
}

function BandDiv({children}:{children:React.ReactNode}) {
  return <div className="my-2 rounded-xl bg-slate-100 p-8">{children}</div>;
}
