-- lockSniper.lua
-- KEYS[1] = lock key (e.g. "snipe:lock:0x123")
-- ARGV[1] = userId
-- ARGV[2] = TTL in seconds

local current = redis.call("GET", KEYS[1])
if current then
  return { "locked", current }
end

redis.call("SETEX", KEYS[1], ARGV[2], ARGV[1])
return { "ok", ARGV[1] }