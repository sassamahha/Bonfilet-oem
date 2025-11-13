import type { Metadata } from 'next';
import './globals.css';

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
      <body className="min-h-screen bg-white text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
