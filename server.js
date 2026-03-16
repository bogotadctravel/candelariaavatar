const next = require('next');
const http = require('http');

const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  // Muy importante
  server.keepAliveTimeout = 60000;      // 60s
  server.headersTimeout = 65000;        // > keepAliveTimeout

  server.listen(3001, () => {
    console.log('Server running on port 3001');
  });
});

