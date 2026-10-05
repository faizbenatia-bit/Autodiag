// Importer Navigate pour rediriger
import { Navigate, Outlet } from "react-router-dom";

// Composant de protection
function ProtectedRoute() {
  // Vérifier la présence du token
  const token = localStorage.getItem("token");

  // Rediriger si l'utilisateur n'est pas connecté
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Autoriser l'affichage de la route enfant
  return <Outlet />;
}

export default ProtectedRoute;