// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin({
  // optional: defaultLocale: 'ja', locales: ['ja', 'en']
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true }
};

export default withNextIntl(nextConfig);
