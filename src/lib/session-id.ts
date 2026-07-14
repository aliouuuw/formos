const SESSION_KEY = 'formos_session_id'

export function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(SESSION_KEY, id)
  return id
}
