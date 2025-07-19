import type { MetadataRoute } from 'next';

import { getPosts } from './posts/_post';
import { getProjects } from './projects/_project';

export const revalidate = false;

const url = (path: string): string =>
  new URL(path, 'https://del.wang').toString();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { path: '/', priority: 1 },
    { path: '/about', priority: 1 },
    { path: '/posts', priority: 0.8 },
    { path: '/projects', priority: 0.8 },
    { path: '/2024', priority: 0.5 },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    sitemapEntries.push({
      url: url(page.path),
      changeFrequency: 'weekly',
      priority: page.priority,
    });
  }

  const posts = await getPosts();
  for (const post of posts.all) {
    sitemapEntries.push({
      url: url(post.path),
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }

  const projects = await getProjects();
  for (const project of projects.all) {
    sitemapEntries.push({
      url: url(project.path),
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  }

  return sitemapEntries;
}
