import { processImage } from './image';

export const kSiteMetadata = {
  home: 'https://del.wang',
  title: 'Del Wang',
  description: 'The best way to predict the future is to create it.',
  image: '/public/cover.png',
};

export async function getOGMetadata(props?: {
  path?: string;
  title?: string;
  description?: string;
  image?: string;
}) {
  const {
    path,
    title = kSiteMetadata.title,
    description = kSiteMetadata.description,
    image = kSiteMetadata.image,
  } = props ?? {};

  const _title =
    title === kSiteMetadata.title
      ? kSiteMetadata.title
      : `${title}｜${kSiteMetadata.title}`;

  const metadata = {
    title: _title,
    alternates: {
      canonical: kSiteMetadata.home + path,
    },
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

  if (path) {
    metadata.alternates = {
      canonical: kSiteMetadata.home + path,
    };
  }
  return metadata;
}
