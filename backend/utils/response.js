export function sendApiError(res, status, code, message, details = null) {
  return res.status(status).json({ success: false, code, message, details });
}

export function sendApiSuccess(res, status, data, meta = null) {
  return res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });
}
