/** Step label for builder preview and public renderer. */
export function formStepLabel(pageIndex: number, pageCount: number, ending: boolean): string {
  if (ending) return 'Done'
  return `Step ${pageIndex + 1} of ${pageCount}`
}

/**
 * Progress fill percentage. Returns null for single-step forms (100% on step 1 is misleading).
 */
export function formProgressPercent(
  pageIndex: number,
  pageCount: number,
  ending: boolean,
): number | null {
  if (pageCount <= 1) return null
  if (ending) return 100
  return Math.round(((pageIndex + 1) / pageCount) * 100)
}
