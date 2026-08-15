#!/usr/bin/env node
/* Serves public/outfit-board and lets the board write grades back into the repo.
   On Vercel that same folder is served statically and /save does not exist, so the
   board falls back to localStorage + the Copy grades button.
   Run:  node styling/serve.js     ->  http://127.0.0.1:8899/   */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(ROOT, '..', 'public', 'outfit-board');
const OUT = path.join(DIR, 'grades.json');
const PORT = 8899;
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.json':'application/json',
                '.css':'text/css', '.md':'text/markdown' };

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', c => {
      body += c;
      if (body.length > 2e6) { req.destroy(); }        // don't let a bad client eat memory
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);                  // validate before touching disk
        data.saved = new Date().toISOString();
        fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
        const n = Object.keys(data.grades || {}).length;
        console.log(`saved ${n} grade(s) -> styling/grades.json`);
        res.writeHead(200, {'Content-Type':'application/json'}).end('{"ok":true}');
      } catch (e) {
        res.writeHead(400, {'Content-Type':'application/json'})
           .end(JSON.stringify({ ok:false, error:e.message }));
      }
    });
    return;
  }

  // static, restricted to this folder
  const rel = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(DIR, rel === '/' ? 'index.html' : rel);
  if (!file.startsWith(DIR)) { res.writeHead(403).end('forbidden'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
                         'Cache-Control': 'no-store' }).end(buf);
  });
}).listen(PORT, '127.0.0.1', () =>
  console.log(`outfit board  ->  http://127.0.0.1:${PORT}/\n` +
              `grades autosave -> ${OUT}\nCtrl-C to stop.`));
