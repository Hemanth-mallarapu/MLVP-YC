import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LedgerOverview } from './pages/LedgerOverview';
import { Dashboard } from './pages/Dashboard';
import { ApplyLoan } from './pages/ApplyLoan';
import { Loans } from './pages/Loans';
import { Members } from './pages/Members';
import { Contributions } from './pages/Contributions';
import { AdminDashboard } from './pages/AdminDashboard'; // Import the new admin view
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { SessionProvider, useSession } from './context/SessionContext';

// This wrapper acts as our Production Guardrail
function ProtectedRoute({ children }: { children: React.JSX.Element }) {
  const { currentMember, loading } = useSession();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7f4eb]">
        <div className="text-[#1e3f20] font-medium animate-pulse text-lg">Loading secure session...</div>
      </div>
    );
  }

  // If not logged in, force them back to the login gateway
  if (!currentMember) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Role-Based Guardrail to protect admin capabilities
function AdminRoute({ children }: { children: React.JSX.Element }) {
  const { currentMember } = useSession();

  // If the logged-in member isn't explicitly configured as an ADMIN, bounce them back to dashboard
  if (currentMember?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Secure Production Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="apply" element={<ApplyLoan />} />
            <Route path="loans" element={<Loans />} />
            <Route path="members" element={<Members />} />
            <Route path="contributions" element={<Contributions />} />
            <Route path="overview" element={<LedgerOverview />} />

            {/* Registered Protected Admin Control Route */}
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}