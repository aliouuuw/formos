import type { CampaignAgent } from '#/lib/campaigns/types'

export function slugifyAgent(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Parse "Name A,Name B" env strings into campaign agents. */
export function parseAgentNames(raw: string | undefined, fallback: readonly string[]): CampaignAgent[] {
  const names = raw?.trim()
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [...fallback]

  return names.map((label) => ({
    id: slugifyAgent(label),
    label,
  }))
}

export function agentOptions(agents: readonly CampaignAgent[]): Array<{ value: string; label: string }> {
  return [{ value: '', label: 'Non assigné' }, ...agents.map((a) => ({ value: a.id, label: a.label }))]
}

export function agentLabel(
  agents: readonly CampaignAgent[],
  value: string | null | undefined,
): string {
  if (!value) return 'Non assigné'
  return agents.find((a) => a.id === value)?.label ?? value
}
