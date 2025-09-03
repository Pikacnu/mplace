import { serve, type ServerWebSocket } from 'bun';
import index from './src/index.html';

type WebSocketType = {
  chunks: any[];
  user: any;
  clientId: string;
};

// init WebServer
const port = Number(process.env.PORT) || 3000;

let OnlineClients: string[] = [];

const server = serve({
  port,
  routes: {
    '/': index,
    '/public/:filename': {
      async GET(request) {
        const filename = request.params.filename;
        if (
          !filename ||
          !filename.match(/\.(js|css|webp|jpg|jpeg|gif|svg|png)$/)
        ) {
          return new Response('Not Found', { status: 404 });
        }
        const filePath = `./src/public/${filename}`;
        const file = Bun.file(filePath);
        if (file.size === 0) {
          return new Response('Not Found', { status: 404 });
        }
        return new Response(file, {
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
        });
      },
    },
    '/ws': {
      async GET(request, server) {
        server.upgrade<WebSocketType>(request, {
          data: {
            chunks: [],
            user: null,
            clientId: Bun.randomUUIDv7(),
          },
        });
        return;
      },
    },
  },
  async fetch(request, server) {
    const requestURL = new URL(request.url);

    // Basic API endpoints for frontend
    if (requestURL.pathname.startsWith('/api')) {
      let endpoint = requestURL.pathname.replace('/api', '');

      switch (endpoint) {
        case '/status': {
          return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    return new Response('Not Found', { status: 404 });
  },

  websocket: {
    idleTimeout: 120,
    async open(ws: ServerWebSocket<WebSocketType>) {
      ws.subscribe(ws.data.clientId);
      OnlineClients.push(ws.data.clientId);
      console.log('Client connected:', ws.data.clientId);
    },
    async message(
      ws: ServerWebSocket<WebSocketType>,
      message: string | Buffer,
    ) {
      let wsMessage;
      try {
        wsMessage = JSON.parse(message.toString());
      } catch (error) {
        console.error('Invalid WebSocket message:', message);
        return;
      }

      // Simple echo for testing
      ws.sendText(
        JSON.stringify({
          type: 'echo',
          payload: wsMessage,
        }),
      );
    },
    async close(ws: ServerWebSocket<WebSocketType>, code, reason) {
      OnlineClients = OnlineClients.filter((id) => id !== ws.data.clientId);
      console.log('WebSocket closed:', code, reason);
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    hmr: true,
    console: true,
  },
});

console.log(`>> Server running at ${server.url}`);

async function onExit() {
  console.log('Received SIGTERM. Cleaning up...');
  server.stop();
}

process.on('SIGINT', onExit);
process.on('SIGTERM', onExit);
process.on('uncaughtException', onExit);
process.on('unhandledRejection', onExit);
