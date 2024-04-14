import { processImage } from './image';

export const kSiteMetadata = {
  title: '🌱 Mint',
  description: '薄荷的花语是：永不消逝的爱 ❤️ ',
};

export const kSiteHome = 'https://del.wang';

export async function getOGMetadata(props: {
  title?: string;
  description?: string;
  image?: string;
}) {
  const { title, description, image } = props;
  return {
    metadataBase: new URL(kSiteHome),
    openGraph: {
      type: 'website',
      url: kSiteHome,
      siteName: kSiteMetadata.title,
      title,
      description: description,
      images: image ? [{ url: (await processImage(image))?.src ?? image }] : [],
    },
  };
}
