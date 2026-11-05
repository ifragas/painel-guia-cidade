import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import DashboardScreen from './pages/DashboardScreen';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-medium">
        Carregando sistema...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <DashboardScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}