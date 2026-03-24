const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROBOT_API = 'https://server2.sudoyantra.com';
const CAMERA_REGISTRY_API = process.env.CAMERA_REGISTRY_API || 'http://server2.sudoyantra.com:5174';
const CAMERA_CONTROL_API = process.env.CAMERA_CONTROL_API || 'http://65.2.178.186:8005';

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
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  const opts = { hostname: url.hostname, port: url.port || (isHttps ? 443 : 80), path: url.pathname + url.search, method: req.method };
  const proxyReq = client.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: e.message }));
  });
  req.pipe(proxyReq);
}

function proxyToBase(req, res, baseUrl, restPath) {
  const path = !restPath || restPath === '/' ? '/' : (restPath.startsWith('/') ? restPath : '/' + restPath);
  const url = new URL(path, baseUrl.replace(/\/$/, '') + '/');
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  const port = url.port ? parseInt(url.port, 10) : (isHttps ? 443 : 80);
  const opts = { hostname: url.hostname, port, path: url.pathname + url.search, method: req.method };
  const proxyReq = client.request(opts, (proxyRes) => {
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
  if (p.startsWith('/api-image')) {
    const targetPath = '/image' + p.slice('/api-image'.length) || '/image/';
    proxy(req, res, targetPath);
    return;
  }
  if (p.startsWith('/api-camera-control')) {
    const rest = p.slice('/api-camera-control'.length) || '/';
    proxyToBase(req, res, CAMERA_CONTROL_API, rest);
    return;
  }
  if (p.startsWith('/api-camera')) {
    const rest = p.slice('/api-camera'.length) || '/';
    proxyToBase(req, res, CAMERA_REGISTRY_API, rest);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Robot Dashboard: http://localhost:${PORT}`);
  console.log(`Proxying API to ${ROBOT_API}`);
  console.log(`Camera registry /api-camera → ${CAMERA_REGISTRY_API}`);
  console.log(`Camera control /api-camera-control → ${CAMERA_CONTROL_API}`);
});
