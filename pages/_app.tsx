import '@/src/styles/reset.css';
import '@/src/styles/global.css';

import Head from 'next/head';

import { Footer } from '../src/components/Layouts/footer';
import { Header } from '../src/components/Layouts/header';

export default function APP({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <title>Mint</title>
        <meta name="description" content="薄荷的花语是：永不消逝的爱 ❤️ " />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </>
  );
}
