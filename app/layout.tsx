import '@/styles/reset.css';
import '@/styles/global.css';
import '@/styles/aspect-ratio.css';

import { Viewport } from 'next';

import { Footer } from '@/components/Layouts/footer';
import { Header } from '@/components/Layouts/header';
import { kSiteMetadata } from '@/utils/site-metadata';

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
