import Link from 'next/link';

import { Column, Expand, Row } from '@/common/components/Flex';

import { getPostsGroupedByYear, Post, PostsGroupedByYear } from './_post';
import styles from './styles.module.css';

export default async function Page() {
  return (
    <Column className={styles.page}>
      {(await getPostsGroupedByYear()).map(e => {
        const posts = e.posts.filter(e => !e.hidden);
        return (
          posts.length > 0 && (
            <YearPost key={e.year} year={e.year} posts={posts} />
          )
        );
      })}
    </Column>
  );
}

const YearPost = (props: PostsGroupedByYear) => {
  const { year, posts } = props;
  if (posts.length < 1) return;
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
          fontWeight: '600',
          color: 'rgba(0, 0, 0, 0.3)',
        }}
      >
        {year}
      </span>
      {posts.map(post => {
        return <PostItem key={post.path} post={post} />;
      })}
    </Column>
  );
};

const PostItem = (props: { post: Post }) => {
  const { post } = props;
  return (
    <Link
      className={styles.post}
      href={post.path}
      style={{
        width: '100%',
      }}
    >
      <Row alignItems="center" width="100%">
        <Expand marginRight="10px">
          <span
            className={styles.title}
            style={{
              fontSize: '18px',
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
          {post.createAt.substring(5)}
        </span>
      </Row>
    </Link>
  );
};
