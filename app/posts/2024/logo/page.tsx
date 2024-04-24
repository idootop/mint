import { generatePostPage } from '../../_post';
import Content from './content.mdx';

// @ts-ignore
const p = await generatePostPage(import.meta.url, Content);
export const metadata = p.metadata;
export default p.Page;
