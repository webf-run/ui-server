import { Hono } from 'hono';

import { proxyBuffer } from '../Util/Proxy.js';

export type ProxyAppOptions = {
  url: string;
};

export async function makeProxyApp(options: ProxyAppOptions): Promise<Hono> {
  const app = new Hono();

  app.all('*', async (c) => {
    return proxyBuffer(c, options.url);
  });

  return app;
}
