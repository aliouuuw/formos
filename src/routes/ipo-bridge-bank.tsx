import { createFileRoute, redirect } from '@tanstack/react-router'

/** Closed Bridge Bank campaign: old shared links land on the current offer, UTMs kept. */
export const Route = createFileRoute('/ipo-bridge-bank')({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/${location.searchStr}`, statusCode: 301 })
  },
})
