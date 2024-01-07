import { allPosts, Post } from 'contentlayer/generated';

type Year = string;
export interface YearPosts {
  year: Year;
  posts: Post[];
}

export const allPostsSorted = allPosts.sort((a, b) => {
  return b.date.localeCompare(a.date, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
});

const getPostsGroupByYear = () => {
  const posts: YearPosts[] = [];
  let year;
  allPostsSorted.forEach(post => {
    if (post.hide) {
      return;
    }
    const _year = post.date.split('-')[0];
    if (_year !== year) {
      posts.push({ year: _year, posts: [post] });
      year = _year;
    } else {
      posts[posts.length - 1].posts.push(post);
    }
  });
  return posts;
};

export const allPostsByYear = getPostsGroupByYear();

export interface PostProps {
  params: {
    slug: string[];
  };
}

export function getPost(params: PostProps['params']) {
  const slug = params?.slug?.join('/');
  return allPostsSorted.find(post => post.slugAsParams === slug);
}

export function getNextPost(params: PostProps['params']) {
  const all = allPostsSorted.filter(e => !e.hide);
  const post = getPost(params)!;
  if (post.hide) {
    return { idx: 0, total: 0, post };
  }
  const idx = all.indexOf(post as any);
  const previous = idx - 1 < 0 ? undefined : all[idx - 1];
  const next = idx + 1 > all.length - 1 ? undefined : all[idx + 1];
  return { idx, total: all.length, post, next, previous };
}
