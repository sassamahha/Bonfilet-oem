// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

// ★ i18n.ts への相対パスを文字列で渡す（このリポは lib/i18n.ts ）
const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },

  // （必要なら一時的にグリーン化する救済）
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true }
};

export default withNextIntl(nextConfig);
