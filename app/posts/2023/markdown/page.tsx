import { generatePostPage } from '../../_post';
import Content from './content.mdx';

const path = '/posts/2023/markdown';

// @ts-ignore
const p = await generatePostPage(path, Content);
export const metadata = p.metadata;
export default p.Page;
