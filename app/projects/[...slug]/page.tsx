import { notFound } from 'next/navigation';

import { generateProjectMetadata } from '../_project';
import { ProjectLayout } from '../_project/ProjectLayout';
import { contents } from '../_project/pages.gen';

type Params = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return Object.keys(contents).map((p) => ({ slug: p.split('/').slice(2) }));
}

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  return generateProjectMetadata(`/projects/${slug.join('/')}`);
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const path = `/projects/${slug.join('/')}`;
  const loader = contents[path];
  if (!loader) {
    notFound();
  }
  const { default: Content } = await loader();
  return (
    <ProjectLayout path={path}>
      <Content />
    </ProjectLayout>
  );
}
