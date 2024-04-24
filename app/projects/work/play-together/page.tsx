import { generateProjectPage } from '../../_project';
import Content from './content.mdx';

// @ts-ignore
const p = await generateProjectPage(import.meta.url, Content);
export const metadata = p.metadata;
export default p.Page;
