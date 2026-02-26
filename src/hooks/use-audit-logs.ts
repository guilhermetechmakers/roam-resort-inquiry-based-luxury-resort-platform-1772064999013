import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAuditLogs,
  exportAuditLogsCsv,
  type AuditLogsFilters,
} from '@/api/audit-logs'

const AUDIT_LOGS_QUERY_KEY = ['audit-logs']

export function useAuditLogs(filters?: AuditLogsFilters) {
  return useQuery({
    queryKey: [...AUDIT_LOGS_QUERY_KEY, filters],
    queryFn: () => fetchAuditLogs(filters),
    staleTime: 30 * 1000,
  })
}

export function useExportAuditLogsCsv() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filters?: AuditLogsFilters) => exportAuditLogsCsv(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_LOGS_QUERY_KEY })
    },
  })
}
