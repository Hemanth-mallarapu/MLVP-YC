import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ApplyLoan } from './pages/ApplyLoan';
import { Loans } from './pages/Loans';
import { Members } from './pages/Members';
import { Contributions } from './pages/Contributions';
import { Login } from './pages/Login';       // We will create this next
import { SignUp } from './pages/SignUp';     // We will create this next
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
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}