import { Request, Response, NextFunction } from 'express'; 
import pino from 'pino';

export const logger = pino({ 
    level: process.env.LOG_LEVEL || 'info', 
    redact: ['req.headers.authorization', 'req.body.password', 'req.body.email'], 
}); 
export const requestLogger = (req: Request, res: Response, next: NextFunction) => { 
    const startTime = Date.now(); 

    res.on('finish', () => { 
        const duration = Date.now() - startTime; 

        logger.info({ 
            method: req.method, 
            url: req.originalUrl || req.url, 
            statusCode: res.statusCode, 
            responseTimeMs: duration, 
            ip: req.ip, 
        }, 'Petición HTTP procesada'); 
        
    }); 

    next(); 
};