// v2: ids stored under the old key may already own a submission (never rotated),
// which made the server drop every later submit from that browser.
const SESSION_KEY = 'formos_session_id_v2'

export function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  return rotateSessionId()
}

/** Start a fresh browser session so the next submit is not treated as a duplicate. */
export function rotateSessionId() {
  const id = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, id)
  return id
}
