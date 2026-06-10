import * as analytics from './analytics'
import * as forms from './forms'
import * as leads from './leads'
import * as submissions from './submissions'

export default {
  forms: {
    list: forms.listForms,
    getById: forms.getFormById,
    getBySlug: forms.getFormBySlug,
    create: forms.createForm,
    update: forms.updateForm,
    publish: forms.publishForm,
    archive: forms.archiveForm,
    stats: forms.getFormStats,
  },
  submissions: {
    submit: submissions.submitForm,
    list: submissions.listSubmissions,
    get: submissions.getSubmission,
    exportCsv: submissions.exportSubmissionsCsv,
  },
  analytics: {
    track: analytics.trackEvent,
    getByForm: analytics.getFormAnalytics,
  },
  leads: {
    list: leads.listLeads,
    updateStatus: leads.updateLeadStatus,
  },
}
