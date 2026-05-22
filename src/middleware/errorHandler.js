import { config } from "../config/config.js";

export const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: {
            message,
            ...(config.nodeEnv === 'development' && { stack: err.stack })
        }
    })
}