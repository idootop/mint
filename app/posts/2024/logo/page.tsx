import { generatePostPage } from '../../_post';
import Content from './content.mdx';

const path = '/posts/2024/logo';

// @ts-ignore
const p = await generatePostPage(path, Content);
export const metadata = p.metadata;
export default p.Page;
