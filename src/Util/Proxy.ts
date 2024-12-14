import type { Context } from 'hono';

export async function proxyBuffer(
  c: Context,
  target: string,
  trim?: RegExp
): Promise<Response> {
  const response = await proxy(c, target, trim);

  const headers = new Headers(response.headers);

  // Buffer response as text and then forward it to the UI.
  const payload = await response.text();
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('transfer-encoding');

  const toSend = new Response(payload, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });

  return toSend;
}

export async function proxy(
  c: Context,
  target: string,
  trim?: RegExp
): Promise<Response> {
  const headers = makeHeaders(c.req.raw.headers);
  const url = makeUrl(c.req.url, target, trim);

  return fetch(url.toString(), {
    method: c.req.method,
    body: c.req.raw.body,
    headers,
    duplex: 'half',
  });
}

function makeHeaders(headers: Headers): Headers {
  const result = new Headers(headers);

  // Do not forward following headers.
  // result.delete('cookie');
  result.delete('host');
  result.delete('origin');
  result.delete('referer');
  result.delete('user-agent');

  return result;
}

/**
 * Returns a new URL where original URL's host is replaced with `targetHost`
 * and path is trimmed. The `search` part is preserved.
 * @param url The fully-formed URL to be targeted to `targetHost`.
 * @param targetHost The host to be used for the new URL.
 * @param trim The prefix to be trimmed from the pathname.
 * @returns
 */
export function makeUrl(
  url: string,
  targetHost: string,
  trim?: RegExp
): string {
  const originalUrl = new URL(url, targetHost);

  const newPath = trim
    ? originalUrl.pathname.replace(trim, '/')
    : originalUrl.pathname;

  const newUrl = new URL(newPath, targetHost);

  newUrl.search = originalUrl.search;

  return newUrl.toString();
}
