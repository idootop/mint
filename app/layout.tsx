import '@/styles/reset.css';
import '@/styles/global.css';
import '@/styles/aspect-ratio.css';

import type { Viewport } from 'next';

import { Footer } from '@/layouts/Footer';
import { Header } from '@/layouts/Header';
import { getOGMetadata } from '@/utils/metadata';

// @ts-expect-error
export const metadata = await getOGMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Layout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
