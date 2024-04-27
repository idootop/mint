import Link from 'next/link';

import { Column, Expand, Row } from '@/common/components/Flex';
import { getPageLinkWithFrom, PageFrom } from '@/utils/page/from';

import { getPostsGroupedByYear, getPostsPinned, Post } from './_post';
import styles from './styles.module.css';

export default async function Page() {
  const pinned = await getPostsPinned();
  return (
    <Column className={styles.page}>
      {pinned.length > 0 && (
        <GroupedPost group="Pinned" posts={pinned} from={PageFrom.pinned} />
      )}
      {(await getPostsGroupedByYear()).map(e => {
        const posts = e.posts.filter(e => !e.hidden);
        return (
          posts.length > 0 && (
            <GroupedPost
              key={e.year}
              group={e.year}
              posts={posts}
              from={PageFrom.all}
            />
          )
        );
      })}
    </Column>
  );
}

const GroupedPost = (props: {
  group: string;
  posts: Post[];
  from: PageFrom;
}) => {
  const { group, posts, from } = props;
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
        {group}
      </span>
      {posts.map(post => {
        return <PostItem key={post.path} post={post} from={from} />;
      })}
    </Column>
  );
};

const PostItem = (props: { post: Post; from: PageFrom }) => {
  const { post, from } = props;
  const postLink = getPageLinkWithFrom({ path: post.path, from });
  return (
    <Link
      className={styles.post}
      href={postLink}
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
