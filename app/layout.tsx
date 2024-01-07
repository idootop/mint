import '@/src/styles/reset.css';
import '@/src/styles/global.css';
import '@/src/styles/aspect-ratio.css';

import { Viewport } from 'next';

import { Footer } from '@/src/components/Layouts/footer';
import { Header } from '@/src/components/Layouts/header';
import { kSiteMetadata } from '@/src/utils/site-metadata';

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
