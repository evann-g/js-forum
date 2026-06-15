import morgan from 'morgan';
import { config } from "../config/config.js";

export const applyLogger = (app) => {
    if (config.nodeEnv !== 'production') {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('combined'));
    }
}