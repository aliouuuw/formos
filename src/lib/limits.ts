/** Max characters per answer value */
export const MAX_ANSWER_VALUE_LENGTH = 10_000

/** Max number of answer keys (should match form field count) */
export const MAX_ANSWER_KEYS = 100

/** Max serialized JSON size for answers + metadata */
export const MAX_JSON_BYTES = 32_768

/** Public form submit: requests per IP+slug per minute */
export const SUBMIT_RATE_LIMIT = { limit: 5, windowMs: 60_000 } as const

/** Public analytics: requests per IP+form per minute */
export const ANALYTICS_RATE_LIMIT = { limit: 120, windowMs: 60_000 } as const
