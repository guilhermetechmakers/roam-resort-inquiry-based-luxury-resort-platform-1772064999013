import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchEmailTemplates,
  fetchEmailTemplateById,
  createEmailTemplate,
  updateEmailTemplate,
  publishEmailTemplate,
  previewEmailTemplate,
  sendTestEmail,
} from '@/api/email-templates'

export function useEmailTemplates(params?: { locale?: string; status?: string }) {
  return useQuery({
    queryKey: ['email-templates', params],
    queryFn: () => fetchEmailTemplates(params),
  })
}

export function useEmailTemplate(id: string | null) {
  return useQuery({
    queryKey: ['email-template', id],
    queryFn: () => (id ? fetchEmailTemplateById(id) : null),
    enabled: !!id,
  })
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
    },
  })
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload: Parameters<typeof updateEmailTemplate>[1]
    }) => updateEmailTemplate(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      queryClient.invalidateQueries({ queryKey: ['email-template', id] })
    },
  })
}

export function usePublishEmailTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: publishEmailTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] })
      queryClient.invalidateQueries({ queryKey: ['email-template', data.id] })
    },
  })
}

export function usePreviewEmailTemplate() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string
      payload?: Record<string, string>
    }) => previewEmailTemplate(id, payload),
  })
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: ({
      templateId,
      to,
      payload,
    }: {
      templateId: string
      to: string
      payload?: Record<string, string>
    }) => sendTestEmail(templateId, to, payload),
  })
}
