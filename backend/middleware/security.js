import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { config } from '../config/index.js';

/**
 * Production-grade security middleware configuration
 * Applies multiple layers of protection for the API
 */

// Helmet configuration for secure HTTP headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Rate limiter for general API requests
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Dashboard and catalog reads are frequent (initial hydration, socket
    // refreshes and polling) and must not consume the write-abuse budget.
    // Auth, booking and review routes retain their own stricter limiters.
    return req.path === '/api/health' || ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  }
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.authRateLimitMax,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
});

// Rate limiter for booking creation to prevent spam
export const bookingRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.bookingRateLimitMax,
  message: {
    success: false,
    code: 'BOOKING_RATE_LIMIT_EXCEEDED',
    message: 'Too many booking requests. Please wait before creating another booking.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Combine user ID with IP for authenticated users
    const userId = req.user?.id || 'anonymous';
    return `${req.ip}-${userId}`;
  }
});

// Rate limiter for review submission
export const reviewRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: {
    success: false,
    code: 'REVIEW_RATE_LIMIT_EXCEEDED',
    message: 'Too many review submissions. Please wait before submitting another review.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public contact forms are intentionally available without a JWT and need a
// dedicated abuse budget separate from authenticated API traffic.
export const supportTicketRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.supportTicketRateLimitMax,
  message: { success: false, code: 'SUPPORT_TICKET_RATE_LIMIT_EXCEEDED', message: 'Too many support requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// HPP (HTTP Parameter Pollution) protection
export const hppConfig = hpp({
  whitelist: [
    // Fields that can legitimately appear multiple times
    'serviceIds',
    'categoryIds'
  ]
});

// Request size limiting configuration
export const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = config.maxRequestSize;
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request payload too large. Maximum size is 1MB.',
      maxSize: maxSize
    });
  }
  next();
};
