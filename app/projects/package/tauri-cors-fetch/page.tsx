import { generateProjectPage } from '../../_project';
import Content from './content.mdx';
import { metadata as meta } from './meta';

// @ts-expect-error
const p = await generateProjectPage(import.meta.url, meta, Content);
export const metadata = p.metadata;
export default p.Page;
