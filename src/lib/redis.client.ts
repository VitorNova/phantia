import Redis from 'ioredis';
import { logger } from './logger.js';

export class RedisClient {
  private static instance: RedisClient;
  private client: Redis;
  private readonly prefix = 'phantia:';

  private constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.on('connect', () => {
      logger.info('[REDIS] Conectado com sucesso');
    });

    this.client.on('error', (err) => {
      logger.error('[REDIS] Erro de conexão:', { error: err.message });
    });

    this.client.on('close', () => {
      logger.warn('[REDIS] Conexão fechada');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  // Verificar conexão
  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // CONTEXTO DE SESSÃO
  // ============================================

  // Salvar contexto com TTL (padrão 1 hora)
  async saveContext(
    sessionId: string,
    context: Record<string, unknown>,
    ttl: number = 3600
  ): Promise<void> {
    const key = `${this.prefix}context:${sessionId}`;
    logger.debug(`[REDIS] Salvando contexto: ${key}`);
    await this.client.setex(key, ttl, JSON.stringify(context));
  }

  // Buscar contexto
  async getContext(sessionId: string): Promise<Record<string, unknown>> {
    const key = `${this.prefix}context:${sessionId}`;
    logger.debug(`[REDIS] Buscando contexto: ${key}`);
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as Record<string, unknown>) : {};
  }

  // Atualizar contexto (merge)
  async updateContext(
    sessionId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const current = await this.getContext(sessionId);
    const merged = { ...current, ...updates };
    await this.saveContext(sessionId, merged);
  }

  // Deletar contexto
  async deleteContext(sessionId: string): Promise<void> {
    const key = `${this.prefix}context:${sessionId}`;
    logger.debug(`[REDIS] Deletando contexto: ${key}`);
    await this.client.del(key);
  }

  // ============================================
  // ESTADO DO ORQUESTRADOR
  // ============================================

  // Salvar estado da conversa
  async saveConversationState(
    remoteJid: string,
    state: Record<string, unknown>,
    ttl: number = 86400 // 24 horas
  ): Promise<void> {
    const key = `${this.prefix}state:${remoteJid}`;
    await this.client.setex(key, ttl, JSON.stringify(state));
  }

  // Buscar estado da conversa
  async getConversationState(
    remoteJid: string
  ): Promise<Record<string, unknown> | null> {
    const key = `${this.prefix}state:${remoteJid}`;
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as Record<string, unknown>) : null;
  }

  // ============================================
  // BUFFER DE MENSAGENS
  // ============================================

  // Adicionar mensagem ao buffer
  async addToMessageBuffer(
    remoteJid: string,
    message: Record<string, unknown>
  ): Promise<void> {
    const key = `${this.prefix}buffer:${remoteJid}`;
    await this.client.rpush(key, JSON.stringify(message));
    await this.client.expire(key, 300); // 5 minutos TTL
  }

  // Pegar todas as mensagens do buffer
  async getMessageBuffer(remoteJid: string): Promise<Record<string, unknown>[]> {
    const key = `${this.prefix}buffer:${remoteJid}`;
    const messages = await this.client.lrange(key, 0, -1);
    return messages.map((m) => JSON.parse(m) as Record<string, unknown>);
  }

  // Limpar buffer
  async clearMessageBuffer(remoteJid: string): Promise<void> {
    const key = `${this.prefix}buffer:${remoteJid}`;
    await this.client.del(key);
  }

  // ============================================
  // LOCK PARA EVITAR PROCESSAMENTO DUPLICADO
  // ============================================

  // Adquirir lock
  async acquireLock(remoteJid: string, ttl: number = 30): Promise<boolean> {
    const key = `${this.prefix}lock:${remoteJid}`;
    const result = await this.client.set(key, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  }

  // Liberar lock
  async releaseLock(remoteJid: string): Promise<void> {
    const key = `${this.prefix}lock:${remoteJid}`;
    await this.client.del(key);
  }

  // ============================================
  // RATE LIMITING
  // ============================================

  // Incrementar contador de rate limit
  async incrementRateLimit(
    remoteJid: string,
    windowSeconds: number = 60
  ): Promise<number> {
    const key = `${this.prefix}rate:${remoteJid}`;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, windowSeconds);
    }
    return count;
  }

  // Verificar rate limit
  async checkRateLimit(
    remoteJid: string,
    maxRequests: number = 30
  ): Promise<boolean> {
    const key = `${this.prefix}rate:${remoteJid}`;
    const count = await this.client.get(key);
    return !count || parseInt(count) < maxRequests;
  }
}
