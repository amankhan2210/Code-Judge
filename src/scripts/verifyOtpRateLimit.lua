    local key = KEYS[1]
    local maxRequests = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])

    local current = tonumber(redis.call("GET", key) or 0)

    if current >= maxRequests then
        return 0
    end

    local newCount = redis.call("INCR", key)

    if newCount == 1 then
        redis.call("EXPIRE", key, window)
    end

    return newCount