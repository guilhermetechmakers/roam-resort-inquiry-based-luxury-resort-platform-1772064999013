import type React from 'react'
import {
  LayoutDashboard,
  FileText,
  User,
  Receipt,
  Bell,
  Shield,
  Settings,
  ClipboardList,
  ShieldCheck,
  Mail,
} from 'lucide-react'

export interface SidebarLink {
  to: string
  label: string
  icon: React.ReactNode
  /** Additional paths that should show this link as active */
  activePaths?: string[]
}

export const hostSidebarLinks: SidebarLink[] = [
  {
    to: '/host/dashboard/listings',
    label: 'Listings',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    to: '/host/listings/new',
    label: 'Create Listing',
    icon: <FileText className="h-5 w-5" />,
    activePaths: ['/host/listings'],
  },
]

export const adminSidebarLinks: SidebarLink[] = [
  { to: '/admin/concierge', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" />, activePaths: ['/admin'] },
  { to: '/admin/inquiries', label: 'Stay Inquiries', icon: <FileText className="h-5 w-5" /> },
  { to: '/admin/contact-inquiries', label: 'Contact Inquiries', icon: <FileText className="h-5 w-5" /> },
  { to: '/admin/email-templates', label: 'Email Templates', icon: <Mail className="h-5 w-5" /> },
  { to: '/admin/email-jobs', label: 'Email & Suppression', icon: <Mail className="h-5 w-5" /> },
  { to: '/admin/exports', label: 'CSV Export / Reports', icon: <FileText className="h-5 w-5" /> },
  { to: '/admin/privacy-requests', label: 'Privacy Requests', icon: <ShieldCheck className="h-5 w-5" /> },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: <ClipboardList className="h-5 w-5" /> },
]

export const profileSidebarLinks: SidebarLink[] = [
  { to: '/profile', label: 'Overview', icon: <User className="h-5 w-5" /> },
  { to: '/profile#inquiries', label: 'My Inquiries', icon: <FileText className="h-5 w-5" /> },
  { to: '/profile#history', label: 'Transaction History', icon: <Receipt className="h-5 w-5" /> },
  { to: '/profile#sessions', label: 'Sessions', icon: <Shield className="h-5 w-5" /> },
  { to: '/profile#notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  { to: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
]
