import '@/src/styles/reset.css';
import '@/src/styles/global.css';

import { Metadata, Viewport } from 'next';

import { Footer } from './footer';
import { Header } from './header';

export const metadata: Metadata = {
  referrer: 'no-referrer',
  title: 'Mint',
  description: '薄荷的花语是：永不消逝的爱 ❤️ ',
};

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
