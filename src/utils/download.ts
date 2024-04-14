import _download from 'download';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { kEnvs, writeFile } from '@/common/utils/io';

const kPendingDownloads = {
  // id: promise,
};

export const download = async (
  url: string,
  options?: { savePath?: string },
) => {
  const { savePath } = options ?? {};
  // eslint-disable-next-line no-async-promise-executor
  kPendingDownloads[url] ??= new Promise(resolve => {
    console.log(`🔥 开始下载 ${url}`);
    _download(url, {
      agent: new HttpsProxyAgent(kEnvs['http_proxy']),
      retry: 3,
      decompress: true,
      followRedirect: true,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0',
        Referer: new URL(url).origin,
      },
    })
      .catch(e => {
        console.log(`❌ 下载失败 ${url}\n`, e);
      })
      .then(async data => {
        if (data) {
          if (savePath) {
            await writeFile(savePath, data);
          }
          console.log(`✅ 下载成功 ${url}`);
          delete kPendingDownloads[url];
        }
        resolve(data);
      });
  });
  return kPendingDownloads[url];
};
