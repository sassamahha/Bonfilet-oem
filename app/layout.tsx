import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bonfilet OEM Ordering',
  description: 'Configure and order Bonfilet wristbands with instant pricing.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`min-h-screen bg-white text-slate-900 ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
