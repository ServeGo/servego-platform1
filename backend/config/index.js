import dotenv from 'dotenv';
dotenv.config();

const required = [];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.warn(`[config] Missing env vars: ${missing.join(', ')} — using defaults`);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  jwtSecret: process.env.JWT_SECRET || 'servego-dev-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET || 'servego-dev-secret'}-refresh`,
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  allowedOrigins: process.env.ALLOWED_ORIGINS || '*',

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  bookingRateLimitMax: parseInt(process.env.BOOKING_RATE_LIMIT_MAX || '5', 10),
  supportTicketRateLimitMax: parseInt(process.env.SUPPORT_TICKET_RATE_LIMIT_MAX || '5', 10),
  maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '1048576', 10),

  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};
