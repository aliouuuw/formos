import '#/polyfill'

import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { SmartCoercionPlugin } from '@orpc/json-schema'
import { createFileRoute } from '@tanstack/react-router'
import { onError } from '@orpc/server'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'

import { FormSchema } from '#/orpc/schema'
import router from '#/orpc/router'
import { auth } from '#/server/auth'

const isProduction = process.env.NODE_ENV === 'production'

const handler = new OpenAPIHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error)
    }),
  ],
  plugins: [
    new SmartCoercionPlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
      specGenerateOptions: {
        info: {
          title: 'Formos API',
          version: '1.0.0',
        },
        commonSchemas: {
          Form: { schema: FormSchema },
          UndefinedError: { error: 'UndefinedError' },
        },
        security: [{ bearerAuth: [] }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
            },
          },
        },
      },
      docsConfig: {
        authentication: {
          securitySchemes: {
            bearerAuth: {
              token: 'default-token',
            },
          },
        },
      },
    }),
  ],
})

async function handle({ request }: { request: Request }) {
  if (isProduction) {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) {
      return new Response('Not Found', { status: 404 })
    }
  }

  const { response } = await handler.handle(request, {
    prefix: '/api',
    context: {
      headers: request.headers,
    },
  })

  return response ?? new Response('Not Found', { status: 404 })
}

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
})
