import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { GlobalLoadingIndicator } from '@/components/ux'
import { AuthProvider } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/auth'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { HomePage } from '@/pages/home'
import { DestinationsPage } from '@/pages/destinations'
import { DestinationDetailPage } from '@/pages/destination-detail'
import { LoginPage } from '@/pages/login'
import { PasswordResetPage } from '@/pages/password-reset'
import { VerifyPage } from '@/pages/verify'
import { InquiryFormPage } from '@/pages/inquiry-form'
import { InquiryConfirmationPage } from '@/pages/inquiry-confirmation'
import {
  ProfileLayout,
  ProfileOverview,
  ProfileInquiries,
  ProfileHistory,
  ProfileSessions,
  ProfileNotifications,
  ProfileSettings,
} from '@/pages/profile'
import { HostDashboardListingsPage } from '@/pages/host-dashboard-listings'
import { HostListingDetailPage } from '@/pages/host-listing-detail'
import { HostListingEditPage } from '@/pages/host-listing-edit'
import { HostListingPreviewPage } from '@/pages/host-listing-preview'
import { AdminConciergeDashboardPage } from '@/pages/admin-concierge-dashboard'
import { AdminInquiryListPage } from '@/pages/admin-inquiry-list'
import { AdminInquiryDetailPage } from '@/pages/admin-inquiry-detail'
import { AdminExportsPage } from '@/pages/admin-exports'
import { AdminAuditLogsPage } from '@/pages/admin-audit-logs'
import { AdminPrivacyRequestsPage } from '@/pages/admin-privacy-requests'
import { AdminContactInquiriesPage } from '@/pages/admin-contact-inquiries'
import { AdminEmailTemplatesPage } from '@/pages/admin-email-templates'
import { AdminEmailJobsPage } from '@/pages/admin-email-jobs'
import { ContactConfirmationPage } from '@/pages/contact-confirmation'
import { ContactPage } from '@/pages/contact'
import { CheckoutPage } from '@/pages/checkout'
import { CheckoutBridgePage } from '@/pages/checkout-bridge'
import { CheckoutCompletePage } from '@/pages/checkout-complete'
import { PaymentSuccessPage } from '@/pages/payment-success'
import { SettingsPage } from '@/pages/settings'
import { TermsOfServicePage } from '@/pages/terms-of-service'
import { PrivacyPolicyPage } from '@/pages/privacy-policy'
import { CookiePolicyPage } from '@/pages/cookie-policy'
import { UnsubscribePage } from '@/pages/unsubscribe'
import { AboutHelpPage } from '@/pages/about-help'
import { NotFoundPage } from '@/pages/not-found'
import { ErrorPage } from '@/pages/error-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

function AppLayout({ children, transparentNav = false }: { children: React.ReactNode; transparentNav?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent={transparentNav} />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  )
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex pt-16">{children}</div>
    </div>
  )
}

function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalLoadingIndicator />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <AppLayout transparentNav>
                  <HomePage />
                </AppLayout>
              }
            />
            <Route
              path="/destinations"
              element={
                <AppLayout>
                  <DestinationsPage />
                </AppLayout>
              }
            />
            <Route
              path="/destinations/:slug"
              element={
                <AppLayout>
                  <DestinationDetailPage />
                </AppLayout>
              }
            />
            <Route
              path="/login"
              element={
                <AppLayout>
                  <LoginPage />
                </AppLayout>
              }
            />
            <Route
              path="/signup"
              element={<Navigate to="/login?signup=1" replace />}
            />
            <Route
              path="/verify"
              element={
                <AppLayout>
                  <VerifyPage />
                </AppLayout>
              }
            />
            <Route
              path="/password-reset"
              element={
                <AppLayout>
                  <PasswordResetPage />
                </AppLayout>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AppLayout>
                  <PasswordResetPage />
                </AppLayout>
              }
            />
            <Route
              path="/reset-password"
              element={
                <AppLayout>
                  <PasswordResetPage />
                </AppLayout>
              }
            />
            <Route
              path="/verify-email"
              element={
                <AppLayout>
                  <VerifyPage />
                </AppLayout>
              }
            />
            <Route
              path="/inquiry/:listingId"
              element={
                <AppLayout>
                  <InquiryFormPage />
                </AppLayout>
              }
            />
            <Route
              path="/inquiries/new"
              element={<Navigate to="/destinations" replace />}
            />
            <Route
              path="/destinations/:slugOrId/inquire"
              element={
                <AppLayout>
                  <InquiryFormPage />
                </AppLayout>
              }
            />
            <Route
              path="/inquiries/confirmation/:inquiryId"
              element={
                <AppLayout>
                  <InquiryConfirmationPage />
                </AppLayout>
              }
            />
            <Route
              path="/inquiry/confirmation/:reference"
              element={
                <AppLayout>
                  <InquiryConfirmationPage />
                </AppLayout>
              }
            />
            <Route
              path="/inquiries/confirmation/:inquiryId"
              element={
                <AppLayout>
                  <InquiryConfirmationPage />
                </AppLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <DashboardLayout>
                  <ProtectedRoute>
                    <ProfileLayout />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            >
              <Route index element={<ProfileOverview />} />
              <Route path="inquiries" element={<ProfileInquiries />} />
              <Route path="history" element={<ProfileHistory />} />
              <Route path="sessions" element={<ProfileSessions />} />
              <Route path="notifications" element={<ProfileNotifications />} />
              <Route path="settings" element={<ProfileSettings />} />
            </Route>
            <Route
              path="/host"
              element={<Navigate to="/host/dashboard/listings" replace />}
            />
            <Route
              path="/host/dashboard/listings"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="host">
                    <HostDashboardListingsPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/host/dashboard/listings/:listingId"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="host">
                    <HostListingDetailPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/host/listings/:listingId"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="host">
                    <HostListingEditPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/host/listings/new"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="host">
                    <HostListingEditPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/host/listings/:listingId/preview"
              element={
                <AppLayout>
                  <ProtectedRoute role="host">
                    <HostListingPreviewPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/admin"
              element={<Navigate to="/admin/concierge" replace />}
            />
            <Route
              path="/admin/concierge"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminConciergeDashboardPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/inquiries"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminInquiryListPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/inquiries/:inquiryId"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminInquiryDetailPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/contact-inquiries"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminContactInquiriesPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/exports"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminExportsPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminAuditLogsPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/privacy-requests"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminPrivacyRequestsPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/email-templates"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminEmailTemplatesPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/email-jobs"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminEmailJobsPage />
                  </ProtectedRoute>
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/suppression"
              element={<Navigate to="/admin/email-jobs" replace />}
            />
            <Route
              path="/contact"
              element={
                <AppLayout>
                  <ContactPage />
                </AppLayout>
              }
            />
            <Route
              path="/contact/confirmation/:inquiryId"
              element={
                <AppLayout>
                  <ContactConfirmationPage />
                </AppLayout>
              }
            />
            <Route
              path="/checkout"
              element={
                <AppLayout>
                  <CheckoutPage />
                </AppLayout>
              }
            />
            <Route
              path="/checkout/bridge/:inquiryId"
              element={
                <CheckoutLayout>
                  <CheckoutBridgePage />
                </CheckoutLayout>
              }
            />
            <Route
              path="/checkout/complete/:inquiryId"
              element={
                <CheckoutLayout>
                  <CheckoutCompletePage />
                </CheckoutLayout>
              }
            />
            <Route
              path="/payments/success"
              element={
                <CheckoutLayout>
                  <PaymentSuccessPage />
                </CheckoutLayout>
              }
            />
            <Route
              path="/payments/success"
              element={
                <CheckoutLayout>
                  <PaymentSuccessPage />
                </CheckoutLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/terms"
              element={
                <AppLayout transparentNav>
                  <TermsOfServicePage />
                </AppLayout>
              }
            />
            <Route
              path="/privacy"
              element={
                <AppLayout transparentNav>
                  <PrivacyPolicyPage />
                </AppLayout>
              }
            />
            <Route
              path="/cookie-policy"
              element={
                <AppLayout transparentNav>
                  <CookiePolicyPage />
                </AppLayout>
              }
            />
            <Route
              path="/cookie-policy"
              element={
                <AppLayout transparentNav>
                  <CookiePolicyPage />
                </AppLayout>
              }
            />
            <Route
              path="/unsubscribe"
              element={
                <AppLayout>
                  <UnsubscribePage />
                </AppLayout>
              }
            />
            <Route
              path="/about-help"
              element={
                <AppLayout transparentNav>
                  <AboutHelpPage />
                </AppLayout>
              }
            />
            <Route
              path="/about"
              element={
                <AppLayout transparentNav>
                  <AboutHelpPage />
                </AppLayout>
              }
            />
            <Route
              path="/help"
              element={
                <AppLayout transparentNav>
                  <AboutHelpPage />
                </AppLayout>
              }
            />
            <Route path="/404" element={<AppLayout><NotFoundPage /></AppLayout>} />
            <Route path="/500" element={<AppLayout><ErrorPage /></AppLayout>} />
            <Route path="*" element={<AppLayout><NotFoundPage /></AppLayout>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
