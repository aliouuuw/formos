import * as analytics from './analytics'
import * as campaigns from './campaigns'
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
    restore: forms.restoreForm,
    delete: forms.deleteForm,
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
    get: leads.getLead,
    stats: leads.getLeadStats,
    insights: leads.getLeadInsightsSummary,
    updateStatus: leads.updateLeadStatus,
    updateAssignee: leads.updateLeadAssignee,
    updateNotes: leads.updateLeadNotes,
    exportCsv: leads.exportLeadsCsv,
  },
  campaigns: {
    list: campaigns.listCampaignConfigs,
    get: campaigns.getCampaignConfig,
    getSettings: campaigns.getCampaignSettings,
    updateSettings: campaigns.updateCampaignSettings,
    getPublicContact: campaigns.getPublicContact,
  },
}
