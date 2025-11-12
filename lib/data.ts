import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';

export type PricingTier = {
  min: number;
  max: number;
  unit: number;
};

export type PricingConfig = {
  tiers: PricingTier[];
  coeff: {
    finish: Record<string, number>;
    size: Record<string, number>;
  };
  // e.g. options.backMessage … 将来用（存在しなくても可）
  options?: Record<string, unknown>;
};

export type ColorConfig = {
  body: Array<{ id: string; label: string; hex: string; effect?: string }>;
  text: Array<{ id: string; label: string; hex: string }>;
  rules: {
    incompat: Array<{ body: string; text: string }>;
  };
};

export type LeadTimeEntry = {
  zone: number;
  days: [number, number];
};

export type LeadTimeConfig = {
  base_production_days: number;
  country_zone: Record<string, LeadTimeEntry>;
  eta_formula: string;
};

const rootDir = process.cwd();
const isProd = process.env.NODE_ENV === 'production';

// -------- simple in-memory cache --------
type CacheMap = Map<string, unknown>;
const cache: CacheMap = new Map();

function cacheKey(file: string) {
  return `data:${file}`;
}

async function readFileUtf8(filePath: string) {
  const raw = await fs.readFile(filePath, 'utf8');
  // strip BOM if present
  return raw.replace(/^\uFEFF/, '');
}

async function readYaml<T>(file: string): Promise<T> {
  const key = cacheKey(file);
  if (isProd && cache.has(key)) {
    return cache.get(key) as T;
  }
  const filePath = path.join(rootDir, 'data', file);
  const raw = await readFileUtf8(filePath);
  const parsed = YAML.parse(raw) as T;
  if (isProd) cache.set(key, parsed);
  else cache.delete(key); // dev は常に最新を読む
  return parsed;
}

// ------------- public loaders -------------
export async function getPricingConfig(): Promise<PricingConfig> {
  return readYaml<PricingConfig>('pricing.yaml');
}

export async function getColorConfig(): Promise<ColorConfig> {
  return readYaml<ColorConfig>('colors.yaml');
}

export async function getLeadTimeConfig(): Promise<LeadTimeConfig> {
  return readYaml<LeadTimeConfig>('leadtime.yaml');
}

export async function getForbiddenWords(): Promise<string[]> {
  const key = cacheKey('forbidden_words.txt');
  if (isProd && cache.has(key)) {
    return cache.get(key) as string[];
  }

  const filePath = path.join(rootDir, 'data', 'forbidden_words.txt');
  const raw = await readFileUtf8(filePath);

  // - 空行無視
  // - 先頭/末尾空白トリム
  // - # 以降はコメント扱い
  // - CRLF/CR 正規化
  const words = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter(Boolean)
    .map((w) => w.toLowerCase());

  if (isProd) cache.set(key, words);
  else cache.delete(key);

  return words;
}
