import Link from 'next/link';

import { Column, Expand, Row } from '@/common/components/Flex';
import { getOGMetadata } from '@/utils/metadata';
import { getPageLinkWithFrom, PageFrom } from '@/utils/page/from';

import { getPostsGroupedByYear, getPostsPinned, Post } from './_post';
import styles from './styles.module.css';

// @ts-ignore
export const metadata = await getOGMetadata({
  title: '博客',
});

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
    <Column className={styles.group} alignItems="start">
      <span className={styles.groupTitle}>{group}</span>
      {posts.map(post => {
        return <PostItem key={post.path} post={post} from={from} />;
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
    <Link className={styles.item} href={postLink}>
      <Row alignItems="center" width="100%">
        <Expand marginRight="10px">
          <span className={styles.title}>{post.title}</span>
        </Expand>
        <span className={styles.date}>{postDate}</span>
      </Row>
    </Link>
  );
};
