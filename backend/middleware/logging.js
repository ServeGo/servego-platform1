/**
 * Request logging middleware for production-grade observability
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Sanitize sensitive data from logs
const sanitizeRequestBody = (body, sensitiveFields = ['password', 'confirmPassword', 'token', 'refreshToken', 'apiKey', 'secret']) => {
  if (!body || typeof body !== 'object') return body;
  
  const sanitized = { ...body };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
};

// Calculate response time
const getResponseTime = (startTime) => {
  const diff = process.hrtime(startTime);
  return Math.round((diff[0] * 1e3 + diff[1] / 1e6) * 100) / 100;
};

// Determine log level based on status code
const getLogLevel = (statusCode) => {
  if (statusCode >= 500) return LOG_LEVELS.ERROR;
  if (statusCode >= 400) return LOG_LEVELS.WARN;
  return LOG_LEVELS.INFO;
};

// Format log entry as structured JSON for easy parsing
const formatLogEntry = (level, data) => {
  return {
    timestamp: new Date().toISOString(),
    level,
    ...data
  };
};

/**
 * Production logging middleware
 */
export const requestLogger = (req, res, next) => {
  // Skip logging for health checks in production to reduce noise
  if (req.path === '/api/health') {
    return next();
  }

  const startTime = process.hrtime();
  const requestId = generateRequestId();
  
  // Attach request ID to request for tracing
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Capture original end function
  const originalEnd = res.end;

  // Override end to capture response
  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);

    const responseTime = getResponseTime(startTime);
    const logLevel = getLogLevel(res.statusCode);

    const logData = formatLogEntry(logLevel, {
      requestId,
      method: req.method,
      path: req.path,
      query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      contentLength: res.get('content-length') || 0
    });

    // Log based on level
    const logMessage = JSON.stringify(logData);
    
    switch (logLevel) {
      case LOG_LEVELS.ERROR:
        console.error(logMessage);
        break;
      case LOG_LEVELS.WARN:
        console.warn(logMessage);
        break;
      default:
        // Only log non-error responses at DEBUG level in production
        if (process.env.NODE_ENV === 'development') {
          console.log(logMessage);
        }
    }

    // Log errors with stack traces
    if (res.statusCode >= 500) {
      console.error('Request failed:', {
        requestId,
        method: req.method,
        path: req.path,
        error: req.err?.message || 'Unknown error',
        stack: req.err?.stack
      });
    }
  };

  next();
};

/**
 * Error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Store error for logging in request logger
  req.err = err;

  // Log the error
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    requestId: req.requestId,
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err.code
    },
    method: req.method,
    path: req.path,
    body: sanitizeRequestBody(req.body)
  }));

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      requestId: req.requestId
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Invalid authentication token',
      requestId: req.requestId
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Authentication token has expired',
      requestId: req.requestId
    });
  }

  // Handle Prisma errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this value already exists',
        requestId: req.requestId
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        code: 'RECORD_NOT_FOUND',
        message: 'The requested record was not found',
        requestId: req.requestId
      });
    }
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 
    ? 'An unexpected error occurred' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    code: err.code || 'INTERNAL_ERROR',
    message,
    requestId: req.requestId
  });
};

/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Generate unique request ID
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${randomPart}`;
}

/**
 * Request timeout middleware
 */
export const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'WARN',
          requestId: req.requestId,
          message: 'Request timeout',
          method: req.method,
          path: req.path
        }));
        
        res.status(504).json({
          success: false,
          code: 'REQUEST_TIMEOUT',
          message: 'Request processing time exceeded limit',
          requestId: req.requestId
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};
