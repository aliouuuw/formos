import { useRouter } from '@tanstack/react-router'

import { authClient } from '#/lib/auth-client'

import { Button } from '#/components/ui/button'

export default function BetterAuthHeader({ stacked = false }: { stacked?: boolean }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-everest-green-05" />
  }

  if (session?.user) {
    return (
      <div className={stacked ? 'space-y-3' : 'flex items-center gap-2'}>
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-full ring-2 ring-everest-green/10"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-everest-green-10 ring-2 ring-everest-green/10">
            <span className="text-xs font-medium text-everest-green">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className={stacked ? 'w-full' : undefined}
          onClick={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: async () => {
                  await router.invalidate()
                  await router.navigate({ to: '/login' })
                },
              },
            })
          }}
        >
          Sign out
        </Button>
      </div>
    )
  }

  return null
}
