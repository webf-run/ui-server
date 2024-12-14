import fs from 'node:fs/promises';
import path from 'node:path';

import { serveStatic } from '@hono/node-server/serve-static';
import { Hono, type Context } from 'hono';

import { proxy, proxyBuffer } from '../Util/Proxy.js';
import { getUrlType } from '../Util/URL.js';

export type UIAppOptions = {
  // The URL of the dev server or the file system path to the UI.
  url: string;
};

export async function makeUIApp(options: UIAppOptions): Promise<Hono> {
  const urlType = getUrlType(options.url);

  if (urlType === 'HTTP') {
    return await makeProxyApp(options);
  } else {
    return await makeFSApp(options);
  }
}

async function makeProxyApp(options: UIAppOptions) {
  const app = new Hono();
  const host = options.url;

  app.get('/:filename{(.+\\..+$)|^@.+}', (c) => {
    return proxyBuffer(c, host);
  });

  app.get('*', async (c) => {
    const response = await proxy(c, host);
    const content = await response.text();

    return serveMain(c, content);
  });

  return app;
}

async function makeFSApp(options: UIAppOptions) {
  const app = new Hono();
  const uiDir = options.url;

  const mainHtml = await fs.readFile(path.join(uiDir, 'index.html'), 'utf-8');

  // Serve static files from the UI directory without authentication.
  app.get('/:filename{(.+\\..+$)|^@.+}', serveStatic({ root: uiDir }));

  app.get('*', async (c) => {
    return serveMain(c, mainHtml);
  });

  return app;
}


async function serveMain(c: Context, content: string) {
  const htmlResponse = await serveHTML(c, content);

  return htmlResponse;
}

async function serveHTML(c: Context, content: string) {
  c.header('content-type', 'text/html');
  c.header('cache-control', 'no-cache');

  return c.html(content, 200);
}
