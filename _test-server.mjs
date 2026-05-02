/**
 * Local test server that adapts the Cloudflare Worker handler
 * to a plain Node.js HTTP server. No wrangler/Miniflare required.
 */
import { createServer } from 'node:http';
import { URL } from 'node:url';

const PORT = parseInt(process.env.PORT || '4009', 10);

// Dynamic import of the worker module (tsx handles TS transpilation)
const worker = (await import('./src/index.ts')).default;

const env = {
  SYNAPSE_API_KEY: process.env.SYNAPSE_API_KEY,
  SYNAPSE_WORKSPACE_ID: process.env.SYNAPSE_WORKSPACE_ID,
  SYNAPSE_API_URL: process.env.SYNAPSE_API_URL || 'https://synapse-api.pyrx.tech',
};

const server = createServer(async (nodeReq, nodeRes) => {
  const url = new URL(nodeReq.url, `http://localhost:${PORT}`);

  // Collect body
  const chunks = [];
  for await (const chunk of nodeReq) chunks.push(chunk);
  const bodyBuffer = Buffer.concat(chunks);

  // Build a Web API Request
  const init = {
    method: nodeReq.method,
    headers: Object.fromEntries(
      Object.entries(nodeReq.headers).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    ),
  };
  if (nodeReq.method !== 'GET' && nodeReq.method !== 'HEAD' && bodyBuffer.length > 0) {
    init.body = bodyBuffer;
  }
  const webRequest = new Request(url.toString(), init);

  try {
    const webResponse = await worker.fetch(webRequest, env);
    nodeRes.writeHead(webResponse.status, Object.fromEntries(webResponse.headers.entries()));
    const buf = Buffer.from(await webResponse.arrayBuffer());
    nodeRes.end(buf);
  } catch (e) {
    nodeRes.writeHead(500, { 'Content-Type': 'application/json' });
    nodeRes.end(JSON.stringify({ error: e.message, status: 500 }));
  }
});

server.listen(PORT, () => {
  console.log(`CF Worker test server listening on http://localhost:${PORT}`);
});
