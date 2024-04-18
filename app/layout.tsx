import '@/styles/reset.css';
import '@/styles/global.css';
import '@/styles/aspect-ratio.css';

import { Viewport } from 'next';

import { Footer } from '@/layouts/Footer';
import { Header } from '@/layouts/Header';
import { kSiteMetadata } from '@/utils/metadata';

export const metadata = kSiteMetadata;

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
