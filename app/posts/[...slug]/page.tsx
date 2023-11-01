import { allPosts, Post } from 'contentlayer/generated';
import { Metadata } from 'next';
import Link from 'next/link';

import { Column } from '@/core/components/Flex';
import { MDXBody } from '@/src/components/MDX/MDXBody';

import { getNextPost, getPost, PostProps } from '../allPostsByYear';
import styles from './styles.module.css';

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params);
  return {
    title: post?.title,
    description: post?.description,
  };
}

export async function generateStaticParams() {
  return allPosts.map(post => ({
    slug: post.slugAsParams.split('/'),
  }));
}

export default function PostPage({ params }: PostProps) {
  const { post, previous, next } = getNextPost(params);

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{post!.title}</h1>
      <p className={styles.date}>{post!.date}</p>
      <MDXBody>{post!.body.code}</MDXBody>
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
