local emailKey = KEYS[1]
local ipKey = KEYS[2]
local cooldownKey = KEYS[3]
local stageKey = KEYS[4]

local maxRequests = tonumber(ARGV[1])
local baseCooldown = tonumber(ARGV[2])
local ipLimit = tonumber(ARGV[3])
local ipWindow = tonumber(ARGV[4])

-- Check active email cooldown
local remaining = redis.call("TTL", cooldownKey)

if remaining > 0 then
    return {-1, remaining}
end

-- Get current counters
local emailAttempts = tonumber(redis.call("GET", emailKey) or 0)
local ipAttempts = tonumber(redis.call("GET", ipKey) or 0)
local cooldownStage = tonumber(redis.call("GET", stageKey) or 0)

-- Fixed IP limit: 5 requests per 15 minutes
if ipAttempts >= ipLimit then
    local ipRemaining = redis.call("TTL", ipKey) 
    return {-2, ipRemaining}
end

-- Allow requests while below the email limit
if emailAttempts < maxRequests then

    redis.call("INCR", emailKey)
    redis.call("EXPIRE", emailKey, 86400)

    local newIpAttempts = redis.call("INCR", ipKey)

    if newIpAttempts == 1 then
        redis.call("EXPIRE", ipKey, ipWindow)
    end

    return {1, emailAttempts + 1}
end

-- Calculate next email cooldown
local newStage = cooldownStage + 1
local cooldown = baseCooldown * (2 ^ (newStage - 1))

-- Store cooldown stage
redis.call("SET", stageKey, newStage, "EX", 86400)

-- Activate email cooldown
redis.call("SET", cooldownKey, "1", "EX", cooldown)

-- Reset email counter to allow one request after cooldown
redis.call("SET", emailKey, maxRequests - 1, "EX", 86400)

return {-1, cooldown}