const SESSION_KEY = 'formos_session_id'

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
