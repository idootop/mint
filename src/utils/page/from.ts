export enum PageFrom {
  all = 'all',
  pinned = 'pinned',
}

export const getPageLinkWithFrom = ({
  path,
  from,
}: {
  path: string;
  from: PageFrom;
}) => {
  return `${path}?from=${from}`.replace('?from=all', '');
};
