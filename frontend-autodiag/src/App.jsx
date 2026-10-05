// Importer React Router
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from "react-router-dom";
import { useEffect, useState } from "react";
import "./App.css";

// Importer les composants
import Navbar from "./component/Navbar";
import ProtectedRoute from "./component/ProtectedRoute";

// Importer les pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Vehicles from "./pages/Vehicles";
import Diagnosis from "./pages/Diagnosis";
import DiagnosisHistory from "./pages/DiagnosisHistory";
import AdminDashboard from "./pages/AdminDashboard";

function NavigationNotification() {
  const location = useLocation();
  return (
    <NotificationMessage
      key={location.key}
      message={location.state?.notification}
    />
  );
}

function NotificationMessage({ message }) {
  const [notification, setNotification] = useState(message || "");

  useEffect(() => {
    if (!message) return undefined;

    const timeout = setTimeout(() => setNotification(""), 4000);

    return () => clearTimeout(timeout);
  }, [message]);

  if (!notification) return null;

  return (
    <div className="navigation-notification" role="status" aria-live="polite">
      {notification}
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname === "/admin";

  return (
    <>
      {!isAdminPage && <Navbar />}
      <NavigationNotification />

      <Routes>
        {/* Page publique */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Pages protégées */}
        <Route element={<ProtectedRoute />}>
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/history" element={<DiagnosisHistory />} />
        </Route>
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>

      {!isAdminPage && (
        <footer className="app-footer">
          <div className="app-footer-line" aria-hidden="true" />
          <p>
            L&apos;application est réalisée par <span>Fayez BEN ATTIA</span>
          </p>
        </footer>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;