// Importer Navigate pour rediriger
import { Navigate, Outlet } from "react-router-dom";

// Composant de protection
function ProtectedRoute({ requiredRole }) {
  // Vérifier la présence du token
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  // Rediriger si l'utilisateur n'est pas connecté
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Autoriser l'affichage de la route enfant
  return <Outlet />;
}

export default ProtectedRoute;