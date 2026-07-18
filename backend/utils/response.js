export function sendApiError(res, status, code, message, details = null) {
  // Controllers may log raw ORM errors, but those details must never cross the
  // API boundary on a server failure.
  const safeDetails = status >= 500 ? null : details;
  return res.status(status).json({ success: false, code, message, details: safeDetails });
}

export function sendApiSuccess(res, status, data, meta = null) {
  return res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });
}
