// Custom single-process Next.js server (avoids `next dev`/`next start` forking).
// Run: node scripts/server.cjs   (from project root, after `npm run build`)
const next = require('next');
const http = require('http');

const port = parseInt(process.env.PORT || '3100', 10);
const app = next({ dev: false, dir: process.cwd() });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    http.createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log('> ATORA ready on http://localhost:' + port);
    });
  })
  .catch((err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
