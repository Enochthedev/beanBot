import Redis from "ioredis"
import fs from "fs"
import path from "path"
import { config } from "@config/index"

const redis = new Redis(config.redisUrl)

const lockScript = fs.readFileSync(path.join(__dirname, "lua", "lockSniper.lua"), "utf8")

export async function tryLockSnipe(tokenAddress: string, userId: string, ttl = 30) {
  const key = `snipe:lock:${tokenAddress.toLowerCase()}`
  const result = await redis.eval(lockScript, 1, key, userId, ttl)

  const [status, info] = result as [string, string]
  return {
    success: status === "ok",
    lockedBy: info
  }
}
