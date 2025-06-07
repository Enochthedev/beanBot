import Redis from 'ioredis'
import { config } from '@config/index'

let redis: Redis | null = null
const memory: Record<string, string> = {}

if (process.env.MOCK_CACHE === '1') {
  redis = null
} else {
  redis = new Redis(config.redisUrl)
}

export const cache = {
  async set(key: string, value: any, options?: { ttl?: number }) {
    const stringified = JSON.stringify(value)
    if (redis) {
      if (options?.ttl) {
        await redis.setex(key, options.ttl, stringified)
      } else {
        await redis.set(key, stringified)
      }
    } else {
      memory[key] = stringified
      if (options?.ttl) {
        setTimeout(() => { delete memory[key] }, options.ttl * 1000)
      }
    }
  },

  async get<T = any>(key: string): Promise<T | null> {
    if (redis) {
      const val = await redis.get(key)
      return val ? JSON.parse(val) : null
    }
    const val = memory[key]
    return val ? JSON.parse(val) : null
  },

  async del(key: string) {
    if (redis) {
      await redis.del(key)
    }
    delete memory[key]
  },
}