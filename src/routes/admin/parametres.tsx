import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '#/components/page-header'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Panel, PanelBody, PanelHeader } from '#/components/ui/panel'
import { slugifyAgent } from '#/lib/campaigns/agents'
import { cn } from '#/lib/utils'
import { orpc } from '#/orpc/client'

export const Route = createFileRoute('/admin/parametres')({
  component: ParametresPage,
})

type AgentRow = { id: string; label: string }

function ParametresPage() {
  const queryClient = useQueryClient()
  const campaignsQuery = useQuery(orpc.campaigns.list.queryOptions({ input: undefined }))
  const [activeId, setActiveId] = useState<string | null>(null)

  const campaigns = campaignsQuery.data ?? []
  const selectedId = activeId ?? campaigns[0]?.id ?? null

  const settingsQuery = useQuery({
    ...orpc.campaigns.getSettings.queryOptions({
      input: { campaignId: selectedId! },
    }),
    enabled: Boolean(selectedId),
  })

  const [agents, setAgents] = useState<AgentRow[]>([])
  const [whatsapp, setWhatsapp] = useState('')

  useEffect(() => {
    if (!settingsQuery.data) return
    setAgents(
      settingsQuery.data.agents.length > 0
        ? settingsQuery.data.agents.map((a) => ({ id: a.id, label: a.label }))
        : [{ id: '', label: '' }],
    )
    setWhatsapp(settingsQuery.data.whatsappNumber ?? '')
  }, [settingsQuery.data])

  const saveMutation = useMutation(
    orpc.campaigns.updateSettings.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.campaigns.list.key() })
        await queryClient.invalidateQueries({ queryKey: orpc.campaigns.getSettings.key() })
        await queryClient.invalidateQueries({ queryKey: orpc.leads.list.key() })
        toast.success('Paramètres enregistrés')
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Enregistrement impossible')
      },
    }),
  )

  function addAgent() {
    setAgents((rows) => [...rows, { id: '', label: '' }])
  }

  function removeAgent(index: number) {
    setAgents((rows) => rows.filter((_, i) => i !== index))
  }

  function updateAgentLabel(index: number, label: string) {
    setAgents((rows) =>
      rows.map((row, i) =>
        i === index ? { id: slugifyAgent(label) || row.id, label } : row,
      ),
    )
  }

  function handleSave() {
    if (!selectedId) return
    const cleaned = agents.filter((a) => a.label.trim())
    if (cleaned.length === 0) {
      toast.error('Ajoutez au moins un agent')
      return
    }
    if (whatsapp && !/^\d{8,15}$/.test(whatsapp)) {
      toast.error('WhatsApp : 8 à 15 chiffres, format international sans +')
      return
    }
    saveMutation.mutate({
      campaignId: selectedId,
      agents: cleaned.map((a) => ({
        id: slugifyAgent(a.label),
        label: a.label.trim(),
      })),
      whatsappNumber: whatsapp.trim() || null,
    })
  }

  return (
    <div className="space-y-10">
      <PageHeader
        kicker="Administration"
        title="Paramètres"
        description="Agents, WhatsApp et données opérationnelles par campagne."
        actions={
          <Link to="/admin/campaigns">
            <Button variant="outline" size="sm">
              Voir les campagnes
            </Button>
          </Link>
        }
      />

      {campaigns.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {campaigns.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={selectedId === c.id ? 'mauve' : 'ghost'}
              onClick={() => setActiveId(c.id)}
            >
              {c.shortName}
            </Button>
          ))}
        </div>
      ) : null}

      {settingsQuery.isLoading ? (
        <p className="text-sm text-night-60">Chargement…</p>
      ) : null}

      {settingsQuery.data ? (
        <Panel>
          <PanelHeader>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-night-80">
              {settingsQuery.data.campaignName}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Ces valeurs sont utilisées dans le pipeline leads, les assignations et les liens
              WhatsApp publics.
            </p>
          </PanelHeader>
          <PanelBody className="space-y-10">
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-night-80">Agents / conseillers</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Liste proposée lors de l&apos;assignation des leads dans le pipeline.
                </p>
              </div>
              <ul className="space-y-3">
                {agents.map((agent, index) => (
                  <li key={index} className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[min(100%,16rem)] flex-1 space-y-1.5">
                      <Label htmlFor={`agent-${index}`} className="text-xs text-text-label">
                        Nom complet
                      </Label>
                      <Input
                        id={`agent-${index}`}
                        value={agent.label}
                        onChange={(e) => updateAgentLabel(index, e.target.value)}
                        placeholder="Prénom Nom"
                      />
                    </div>
                    {agents.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-night-60 hover:text-red-600"
                        onClick={() => removeAgent(index)}
                        aria-label="Supprimer l'agent"
                      >
                        <Trash2 size={16} />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Button type="button" variant="outline" size="sm" onClick={addAgent}>
                <Plus size={16} className="mr-1.5" />
                Ajouter un agent
              </Button>
            </section>

            <section className="space-y-4 border-t border-mauve/10 pt-8">
              <div>
                <h3 className="text-sm font-semibold text-night-80">WhatsApp Business</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Numéro affiché sur la landing et les formulaires (format international sans +,
                  ex. 2250700000000).
                </p>
              </div>
              <div className="max-w-md space-y-1.5">
                <Label htmlFor="whatsapp" className="text-xs text-text-label">
                  Numéro
                </Label>
                <Input
                  id="whatsapp"
                  inputMode="numeric"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                  placeholder="2250700000000"
                />
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3 border-t border-mauve/10 pt-6">
              <Button
                variant="mauve"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                showArrow
              >
                {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
              {settingsQuery.data.updatedAt ? (
                <p className="text-xs text-text-secondary">
                  Dernière mise à jour :{' '}
                  {new Date(settingsQuery.data.updatedAt).toLocaleString('fr-FR')}
                </p>
              ) : null}
            </div>
          </PanelBody>
        </Panel>
      ) : null}

      {!settingsQuery.isLoading && campaigns.length === 0 ? (
        <Panel>
          <PanelBody className="text-sm text-text-secondary">
            Aucune campagne configurée dans le registre applicatif.
          </PanelBody>
        </Panel>
      ) : null}
    </div>
  )
}
