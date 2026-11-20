import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Sales Dashboard',
  description: 'VSL sales metrics from your team’s EOD reports and Meta Ads.',
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
