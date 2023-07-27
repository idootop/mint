import { allPosts, Post } from 'contentlayer/generated';
import { Metadata } from 'next';
import Link from 'next/link';

import { Column } from '@/core/components/Flex';
import { MDXBody } from '@/src/components/MDX/MDXBody';

import { allPostsSorted } from '../allPostsByYear';
import styles from './styles.module.css';

interface PostProps {
  params: {
    slug: string[];
  };
}

async function getPostFromParams(params: PostProps['params']) {
  const slug = params?.slug?.join('/');
  return allPosts.find(post => post.slugAsParams === slug);
}

export async function generateMetadata({
  params,
}: PostProps): Promise<Metadata> {
  const post = await getPostFromParams(params);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
  };
}

export async function generateStaticParams(): Promise<PostProps['params'][]> {
  return allPosts.map(post => ({
    slug: post.slugAsParams.split('/'),
  }));
}

export default async function PostPage({ params }: PostProps) {
  const post = await getPostFromParams(params);

  if (!post) {
    return '404';
  }

  const idx = allPostsSorted.indexOf(post);
  const previous = idx - 1 < 0 ? undefined : allPostsSorted[idx - 1];
  const next =
    idx + 1 > allPostsSorted.length - 1 ? undefined : allPostsSorted[idx + 1];

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{post.title}</h1>
      <p className={styles.date}>{post.date}</p>
      <MDXBody>{post.body.code}</MDXBody>
      <PostFooter previous={previous} next={next} />
    </main>
  );
}

const PostFooter = (props: { previous?: Post; next?: Post }) => {
  const { previous, next } = props;
  return (
    <Column
      alignItems="center"
      style={{
        width: '100%',
        padding: '24px',
        background: '#161616',
      }}
    >
      {previous && <NavItem label="Previous" post={previous} />}
      {next && <NavItem label="Next" post={next} />}
    </Column>
  );
};

const NavItem = (props: { label: string; post: Post }) => {
  const { label, post } = props;
  return (
    <Column
      className={styles.link}
      style={{
        textAlign: 'center',
      }}
    >
      <span
        style={{
          marginBottom: '6px',
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}
      >
        {label}
      </span>
      <Link href={post.slug}>{post.title}</Link>
    </Column>
  );
};
