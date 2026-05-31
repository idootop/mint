import { notFound } from 'next/navigation';

import { generatePostMetadata } from '../_post';
import { PostLayout } from '../_post/PostLayout';
import { contents } from '../_post/pages.gen';

type Params = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return Object.keys(contents).map((p) => ({ slug: p.split('/').slice(2) }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  return generatePostMetadata(`/posts/${slug.join('/')}`);
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const path = `/posts/${slug.join('/')}`;
  const loader = contents[path];
  if (!loader) {
    notFound();
  }
  const { default: Content } = await loader();
  return (
    <PostLayout path={path}>
      <Content />
    </PostLayout>
  );
}
