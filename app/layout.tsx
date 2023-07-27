import '@/src/styles/reset.css';
import '@/src/styles/global.css';

import { Footer } from './footer';
import { Header } from './header';

export const metadata = {
  referrer: 'no-referrer',
  title: 'Next typescript template',
  description: 'A simple next typescript template',
  viewport:
    'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no',
};

export default function Layout({ children }: { children: React.ReactNode }) {
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
