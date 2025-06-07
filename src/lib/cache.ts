import Redis from "ioredis"
import { config } from "@config/index"

const redis = new Redis(config.redisUrl)

export const cache = {
  async set(key: string, value: any, options?: { ttl?: number }) {
    const stringified = JSON.stringify(value)
    if (options?.ttl) {
      await redis.setex(key, options.ttl, stringified)
    } else {
      await redis.set(key, stringified)
    }
  },

  async get<T = any>(key: string): Promise<T | null> {
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  },

  async del(key: string) {
    await redis.del(key)
  },
}