import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './lib/logger.js';
import { RedisClient } from './lib/redis.client.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Verificar Redis
    const redis = RedisClient.getInstance();
    const redisOk = await redis.ping();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisOk ? 'connected' : 'disconnected',
      },
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Webhook endpoint para WhatsApp
app.post('/webhook', async (req, res) => {
  logger.info('[WEBHOOK] Mensagem recebida', { body: req.body });

  // TODO: Implementar processamento de mensagem
  // 1. Parsear mensagem
  // 2. Carregar contexto do Redis
  // 3. Executar orquestrador
  // 4. Enviar resposta

  res.status(200).json({ received: true });
});

// Error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error('[ERROR]', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Startup
async function bootstrap() {
  try {
    logger.info('[STARTUP] Iniciando Phantia...');

    // Inicializar Redis
    const redis = RedisClient.getInstance();
    await redis.ping();
    logger.info('[STARTUP] Redis conectado');

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`[STARTUP] Servidor rodando na porta ${PORT}`);
      logger.info(`[STARTUP] Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`[STARTUP] Health: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('[STARTUP] Falha ao iniciar:', error);
    process.exit(1);
  }
}

bootstrap();
