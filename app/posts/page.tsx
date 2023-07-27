import { Post } from 'contentlayer/generated';
import Link from 'next/link';

import { Column, Expand, Row } from '@/core/components/Flex';

import { allPostsByYear, YearPosts } from './allPostsByYear';
import styles from './styles.module.css';

export default async function Page() {
  return (
    <Column className={styles.page}>
      {allPostsByYear.map(e => {
        return <YearPost key={e.year} year={e.year} posts={e.posts} />;
      })}
    </Column>
  );
}

const YearPost = (props: YearPosts) => {
  const { year, posts } = props;
  return (
    <Column
      className={styles.year}
      alignItems="start"
      style={{
        width: '100%',
        padding: '20px',
        background: '#fff',
        borderRadius: '2px',
        boxShadow: '0 1px 2px -1px rgba(0, 0, 0, 0.08)',
      }}
    >
      <span
        style={{
          fontSize: '18px',
          fontWeight: '400',
          color: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        {year}
      </span>
      {posts.map(post => {
        return <PostItem key={post.title} post={post} />;
      })}
    </Column>
  );
};

const PostItem = (props: { post: Post }) => {
  const { post } = props;
  return (
    <Link
      className={styles.post}
      href={post.slug}
      style={{
        width: '100%',
      }}
    >
      <Row alignItems="center" width="100%">
        <Expand marginRight="10px">
          <span
            style={{
              fontSize: '18px',
              fontWeight: '400',
              color: '#000',
            }}
          >
            {post.title}
          </span>
        </Expand>
        <span
          style={{
            fontSize: '15px',
            fontWeight: '400',
            color: 'rgba(0, 0, 0, 0.3)',
          }}
        >
          {post.date.substring(5)}
        </span>
      </Row>
    </Link>
  );
};
