import { generatePostPage } from '../../_post';
import Content from './content.mdx';
import { metadata as meta } from './meta';

// @ts-expect-error
const p = await generatePostPage(import.meta.url, meta, Content);
export const metadata = p.metadata;
export default p.Page;
