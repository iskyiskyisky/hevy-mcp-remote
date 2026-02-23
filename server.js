const http = require('http');
const { spawn } = require('child_process');
const url = require('url');

const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
const PORT = process.env.PORT || 10000;
const PROXY_PORT = 9999;

if (!AUTH_TOKEN) {
  console.warn('WARNING: MCP_AUTH_TOKEN not set, server is unprotected');
}

// Start mcp-proxy on internal port
const child = spawn('mcp-proxy', ['--port', String(PROXY_PORT), '--', 'hevy-mcp'], {
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  console.error(`mcp-proxy exited with code ${code}`);
  process.exit(code || 1);
});

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // Check token on SSE endpoint (initial connection)
  // The /message endpoint is session-protected by mcp-proxy
  if (AUTH_TOKEN && parsed.pathname === '/sse') {
    if (parsed.query.token !== AUTH_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      res.end('Unauthorized');
      return;
    }
  }

  // Strip the token query param before forwarding to mcp-proxy
  const forwardPath = parsed.pathname === '/sse'
    ? '/sse'
    : req.url;

  const options = {
    hostname: '127.0.0.1',
    port: PROXY_PORT,
    path: forwardPath,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${PROXY_PORT}` }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Service unavailable');
    }
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`Auth proxy on port ${PORT} -> mcp-proxy on port ${PROXY_PORT}`);
});
