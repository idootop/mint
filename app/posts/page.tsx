import Link from 'next/link';

import { Column, Expand, Row } from '@/common/components/Flex';
import { getOGMetadata } from '@/utils/metadata';
import { getPageLinkWithFrom, PageFrom } from '@/utils/page/from';

import { getPostsGroupedByYear, getPostsPinned, type Post } from './_post';
import styles from './styles.module.css';

// @ts-expect-error
export const metadata = await getOGMetadata({
  path: '/posts',
  title: '博客',
});

export default async function Page() {
  const pinned = await getPostsPinned();
  return (
    <Column className={styles.page}>
      {pinned.length > 0 && (
        <GroupedPost from={PageFrom.pinned} group="Pinned" posts={pinned} />
      )}
      {(await getPostsGroupedByYear()).map((e) => {
        const posts = e.posts.filter((e) => !e.hidden);
        return (
          posts.length > 0 && (
            <GroupedPost
              from={PageFrom.all}
              group={e.year}
              key={e.year}
              posts={posts}
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
    <Column alignItems="start" className={styles.group}>
      <span className={styles.groupTitle}>{group}</span>
      {posts.map((post) => {
        return <PostItem from={from} key={post.path} post={post} />;
      })}
    </Column>
  );
};

const PostItem = (props: { post: Post; from: PageFrom }) => {
  const { post, from } = props;
  const postLink = getPageLinkWithFrom({ path: post.path, from });
  const postDate =
    from === PageFrom.pinned
      ? post.createAt.replaceAll('-', '.')
      : post.createAt.substring(5);
  return (
    <Link className={styles.item} href={postLink} prefetch={false}>
      <Row alignItems="center" width="100%">
        <Expand marginRight="10px">
          <span className={styles.title}>{post.title}</span>
        </Expand>
        <span className={styles.date}>{postDate}</span>
      </Row>
    </Link>
  );
};
