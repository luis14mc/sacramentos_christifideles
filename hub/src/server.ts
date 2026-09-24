import { createServer } from 'node:http';
import { enrutar } from './router';

/** Adaptador node:http → Request/Response estándar. */
const MAX_CUERPO = 256 * 1024;

const server = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  let tamano = 0;
  for await (const chunk of req) {
    tamano += (chunk as Buffer).length;
    if (tamano > MAX_CUERPO) {
      res.writeHead(413).end();
      return;
    }
    chunks.push(chunk as Buffer);
  }

  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v);
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const request = new Request(`http://${req.headers.host ?? 'hub'}${req.url ?? '/'}`, {
    method: req.method,
    headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  });

  const response = await enrutar(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
});

const port = Number(process.env.PORT ?? 4000);
server.listen(port, '0.0.0.0', () => {
  console.log(`Hub de interoperabilidad escuchando en :${port}`);
});
