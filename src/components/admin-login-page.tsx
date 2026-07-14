import { useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) throw new Error(result.error.message)
      await navigate({ to: '/admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-split min-h-dvh lg:grid lg:grid-cols-[minmax(25rem,0.9fr)_minmax(34rem,1.1fr)]">
      <aside className="login-brand relative flex min-h-[17rem] flex-col overflow-hidden px-7 py-8 sm:px-10 sm:py-10 lg:min-h-dvh lg:px-[clamp(3rem,6vw,6.5rem)] lg:py-14">
        <div className="login-brand-top relative z-10 flex items-center gap-3">
          <span className="login-monogram" aria-hidden>
            F
          </span>
          <div>
            <p className="text-sm font-semibold leading-none tracking-[-0.01em] text-white/95">
              Everest Finance
            </p>
            <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45">
              Plateforme interne
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-auto pb-10 pt-16 lg:pb-16 lg:pt-24">
          <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
            <span className="h-px w-8 bg-gold/60" /> Communication & marketing
          </p>
          <h1 className="login-wordmark font-display-aptos text-7xl font-semibold leading-[0.92] tracking-[-0.06em] text-white sm:text-8xl lg:text-[clamp(5rem,7.5vw,7.5rem)]">
            Formos
          </h1>
          <p className="mt-6 max-w-md text-base font-light leading-7 text-white/70 lg:text-lg lg:leading-8">
            Créez vos formulaires de campagne et centralisez les leads au même endroit.
          </p>
        </div>

        <div className="relative z-10 mt-auto hidden items-center gap-3 text-[11px] text-white/40 lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-gold/70" />
          Accès réservé aux équipes Everest Finance
        </div>
      </aside>

      <main className="login-form-side relative flex min-h-[calc(100dvh-17rem)] items-center justify-center px-6 py-14 sm:px-10 lg:min-h-dvh lg:px-16">
        <div className="login-card w-full max-w-[26rem] rise-in">
          <div className="mb-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-mauve-60">
              Espace sécurisé
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-night-80">Connexion</h2>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Utilisez votre compte Everest Finance.
            </p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="login-label">
                Adresse email
              </Label>
              <div className="login-field">
                <Mail size={16} aria-hidden />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  placeholder="prenom.nom@everest-finance.fr"
                  className="border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="login-label">
                Mot de passe
              </Label>
              <div className="login-field">
                <LockKeyhole size={16} aria-hidden />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  className="border-0 bg-transparent px-10 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error ? (
              <p
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="mauve" size="lg" className="mt-2 h-12 w-full" disabled={loading} showArrow>
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-text-secondary">
            Besoin d&apos;un accès ? Contactez l&apos;administrateur Formos de votre équipe.
          </p>
        </div>
      </main>
    </div>
  )
}
