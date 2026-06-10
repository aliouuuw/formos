import { inngest } from '#/inngest/client'

export const processFormSubmission = inngest.createFunction(
  {
    id: 'process-form-submission',
    name: 'Process form submission',
    triggers: [{ event: 'form/submission.completed' }],
  },
  async ({ event, step }) => {
    await step.run('log-submission', async () => {
      console.info('[inngest] New form submission', {
        formId: event.data.formId,
        submissionId: event.data.submissionId,
        leadId: event.data.leadId,
        email: event.data.email,
      })
    })

    return { ok: true }
  },
)

export const inngestFunctions = [processFormSubmission]
