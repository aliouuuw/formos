import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ location }) => {
    throw redirect({
      to: '/ipo-bridge-bank',
      search: location.search,
    })
  },
  component: () => null,
})
