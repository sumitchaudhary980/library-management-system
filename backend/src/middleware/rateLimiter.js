const path = require("path");
const ratelimit = require("../config/upstash");

const rateLimiter = async (req, res, next) => {
  try {
    const { success } = await ratelimit.limit(req.ip);

    if (!success) {
      // API requests return JSON
      if (req.originalUrl.startsWith("/api")) {
        return res.status(429).json({
          message: "Too many requests. Please try again later.",
        });
      }

      // Normal pages show 500 page
      return res.status(429).sendFile(
        path.join(__dirname, "../../frontend/errors/500.html")
      );
    }

    next();

  } catch (error) {
    next(error);
  }
};

module.exports = rateLimiter;