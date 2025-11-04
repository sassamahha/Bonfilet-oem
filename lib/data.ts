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
  options: Record<string, number>;
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

async function readYaml<T>(file: string): Promise<T> {
  const filePath = path.join(rootDir, 'data', file);
  const raw = await fs.readFile(filePath, 'utf8');
  return YAML.parse(raw) as T;
}

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
  const filePath = path.join(rootDir, 'data', 'forbidden_words.txt');
  const raw = await fs.readFile(filePath, 'utf8');
  return raw
    .split('\n')
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);
}
