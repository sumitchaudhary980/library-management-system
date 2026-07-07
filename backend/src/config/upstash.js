const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "60 s"),
    analytics: true,
});

module.exports = ratelimit;