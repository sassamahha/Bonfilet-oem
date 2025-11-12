// app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import type { Locale } from '@/lib/i18n';
import { localeNames } from '@/lib/i18n';
import Navigation from '@/components/navigation';

export const metadata: Metadata = {
  title: 'Bonfilet OEM Ordering',
  description: 'Instantly configure and order personalized Bonfilet bands.'
};

// リポ内の JSON を読み込むローカル関数
async function getMessages(locale: Locale) {
  const mod = await import(`@/messages/${locale}.json`);
  return mod.default;
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  const messages = await getMessages(params.locale);

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <div className="flex min-h-screen flex-col">
        <Navigation currentLocale={params.locale} localeNames={localeNames} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-slate-50 py-8 text-sm text-slate-500">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6">
            <span>© {new Date().getFullYear()} Bonfilet OEM</span>
            <span className="text-slate-400">
              Built for instant team merch ordering worldwide.
            </span>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
