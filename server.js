const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROBOT_API = 'http://65.2.178.186:5174';

function serveFile(filePath, res) {
  const ext = path.extname(filePath);
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function proxy(req, res, targetPath) {
  const url = new URL(targetPath, ROBOT_API);
  const opts = { hostname: url.hostname, port: url.port || 80, path: url.pathname + url.search, method: req.method };
  const proxyReq = http.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: e.message }));
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || '/', 'http://localhost');
  const p = u.pathname;

  if (p === '/' || p === '/index.html') {
    serveFile(path.join(__dirname, 'index.html'), res);
    return;
  }
  if (p.startsWith('/api/')) {
    const targetPath = p.replace(/^\/api/, '');
    proxy(req, res, targetPath);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Robot Dashboard: http://localhost:${PORT}`);
  console.log(`Proxying API to ${ROBOT_API}`);
});
