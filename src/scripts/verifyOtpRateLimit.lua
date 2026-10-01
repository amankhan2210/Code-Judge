    local ipKey = KEYS[1]
    local emailKey = KEYS[2]

    local maxRequests = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])

    local ipCount = tonumber(redis.call("GET", ipKey) or 0)
    local emailCount = tonumber(redis.call("GET", emailKey) or 0)

    if ipCount >= maxRequests or emailCount >= maxRequests then
        return 0
    end

    local newIpCount = redis.call("INCR", ipKey)
    local newEmailCount = redis.call("INCR", emailKey)

    if newIpCount == 1 then
        redis.call("EXPIRE", ipKey, window)
    end

    if newEmailCount == 1 then
        redis.call("EXPIRE", emailKey, window)
    end

    return 1