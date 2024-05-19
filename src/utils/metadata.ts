import { processImage } from './image';

export const kSiteMetadata = {
  home: 'https://del.wang',
  title: 'Del Wang',
  description: 'The best way to predict the future is to create it.',
  image: '/public/cover.png',
};

export async function getOGMetadata(props?: {
  title?: string;
  description?: string;
  image?: string;
}) {
  const {
    title = kSiteMetadata.title,
    description = kSiteMetadata.description,
    image = kSiteMetadata.image,
  } = props ?? {};
  const _title =
    title === kSiteMetadata.title
      ? kSiteMetadata.title
      : `${title}｜${kSiteMetadata.title}`;
  return {
    title: _title,
    metadataBase: new URL(kSiteMetadata.home),
    openGraph: {
      type: 'website',
      url: kSiteMetadata.home,
      siteName: kSiteMetadata.title,
      title,
      description: description,
      images: image ? [{ url: (await processImage(image))?.src ?? image }] : [],
    },
  };
}
