const store = new Map(); // key -> { count, resetAt }

/**
 * createRateLimit(options) — returns an Express middleware.
 * @param {number} options.windowMs   Time window in ms (default: 15 minutes)
 * @param {number} options.max        Max requests per window (default: 100)
 * @param {string} options.message    Error message
 */
export function createRateLimit({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests' } = {}) {
    return (req, res, next) => {
        const key = req.ip;
        const now = Date.now();
        const entry = store.get(key);

        if (!entry || now > entry.resetAt) {
            store.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        entry.count++;
        if (entry.count > max) {
            res.set('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
            return res.status(429).json({ error: message });
        }
        next();
    };
}

export const authLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Trop de tentatives, réessayez plus tard.' });
export const apiLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
