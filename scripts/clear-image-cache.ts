import { deleteFile } from '@/common/utils/io';
import { kImageCachePath } from '@/utils/image';

async function main() {
  await deleteFile(kImageCachePath);
}

main();
