import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchActivities,
  createActivity,
  createInternalNoteActivity,
  updateActivity,
  type FetchActivitiesParams,
  type CreateActivityPayload,
  type UpdateActivityPayload,
} from '@/api/activities'
import type { Activity, ActivityFilters } from '@/types'

const ACTIVITIES_QUERY_KEY = 'activities'

export function useActivities(params: FetchActivitiesParams) {
  const { inquiryId, limit, offset, filters, includeInternal } = params

  return useQuery({
    queryKey: [ACTIVITIES_QUERY_KEY, inquiryId, limit, offset, filters, includeInternal],
    queryFn: () => fetchActivities({ inquiryId, limit, offset, filters, includeInternal }),
    enabled: !!inquiryId,
  })
}

export function useCreateActivity(inquiryId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: Omit<CreateActivityPayload, 'inquiry_id'>) =>
      createActivity({ ...payload, inquiry_id: inquiryId ?? '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY, inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-activity', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiry', 'detail'] })
    },
  })
}

export function useCreateInternalNoteActivity(inquiryId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      content,
      actorId,
      actorName,
    }: {
      content: string
      actorId: string
      actorName?: string
    }) => createInternalNoteActivity(inquiryId ?? '', content, actorId, actorName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY, inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-activity', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-notes', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiry', 'detail'] })
    },
  })
}

export function useUpdateActivity(inquiryId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, payload }: { activityId: string; payload: UpdateActivityPayload }) =>
      updateActivity(activityId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_QUERY_KEY, inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-activity', inquiryId] })
    },
  })
}
