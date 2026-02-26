import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
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
import { ProfilePage } from '@/pages/profile'
import { HostDashboardPage } from '@/pages/host-dashboard'
import { HostListingEditPage } from '@/pages/host-listing-edit'
import { AdminDashboardPage } from '@/pages/admin-dashboard'
import { AdminInquiryListPage } from '@/pages/admin-inquiry-list'
import { AdminInquiryDetailPage } from '@/pages/admin-inquiry-detail'
import { AdminExportsPage } from '@/pages/admin-exports'
import { ContactPage } from '@/pages/contact'
import { CheckoutPage } from '@/pages/checkout'
import { SettingsPage } from '@/pages/settings'
import { StaticPage } from '@/pages/static-page'
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
              path="/verify"
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
                <AppLayout>
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                </AppLayout>
              }
            />
            <Route
              path="/host"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="host">
                    <HostDashboardPage />
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
              path="/admin"
              element={
                <DashboardLayout>
                  <ProtectedRoute role="concierge">
                    <AdminDashboardPage />
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
              path="/contact"
              element={
                <AppLayout>
                  <ContactPage />
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
              path="/settings"
              element={
                <AppLayout>
                  <SettingsPage />
                </AppLayout>
              }
            />
            <Route
              path="/terms"
              element={
                <AppLayout>
                  <StaticPage
                    title="Terms of Service"
                    content={
                      <p className="text-muted-foreground">
                        Terms of service content would go here. This is a placeholder.
                      </p>
                    }
                  />
                </AppLayout>
              }
            />
            <Route
              path="/privacy"
              element={
                <AppLayout>
                  <StaticPage
                    title="Privacy Policy"
                    content={
                      <p className="text-muted-foreground">
                        Privacy policy content would go here. This is a placeholder.
                      </p>
                    }
                  />
                </AppLayout>
              }
            />
            <Route
              path="/help"
              element={
                <AppLayout>
                  <StaticPage
                    title="Help"
                    content={
                      <p className="text-muted-foreground">
                        Help and FAQ content would go here. This is a placeholder.
                      </p>
                    }
                  />
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
