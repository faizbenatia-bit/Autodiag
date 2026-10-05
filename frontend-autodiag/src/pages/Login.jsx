// Importer les hooks et les outils nécessaires
import { useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";

// Importer notre instance Axios
import api from "../api/axios";

// Composant de connexion
function Login() {
  // Stocker les données du formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Gérer les messages d'erreur
  const [error, setError] = useState("");

  // Gérer l'état du chargement
  const [loading, setLoading] = useState(false);

  // Permettre la navigation
  const navigate = useNavigate();

  // Fonction exécutée à la soumission du formulaire
  const handleSubmit = async (e) => {
    // Empêcher le rechargement de la page
    e.preventDefault();

    // Réinitialiser l'erreur
    setError("");

    // Activer l'indicateur de chargement
    setLoading(true);

    try {
      // Envoyer les identifiants au backend
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      // Récupérer le token de la réponse
      const token = response.data.token;

      // Vérifier que le token existe
      if (!token) {
        throw new Error("Le serveur n'a pas retourné de token.");
      }

      // Stocker le token pour les prochaines requêtes
      localStorage.setItem("token", token);

      // Rediriger vers la page des véhicules
      navigate("/vehicles", {
        state: { notification: "Utilisateur connecté avec succès." },
      });
    } catch (err) {
      // Afficher un message en cas d'erreur
      setError(
        err.response?.data?.message ||
        err.message ||
        "Erreur de connexion"
      );
    } finally {
      // Désactiver le chargement
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Form className="auth-form" onSubmit={handleSubmit}>
        <span className="eyebrow mb-2">Ravi de vous revoir</span>
        <h1>Connexion à AutoDiag</h1>
        <p className="auth-intro">Connectez-vous pour retrouver votre garage et vos diagnostics.</p>

        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Adresse email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemple@email.com"
            autoComplete="email"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            autoComplete="current-password"
            required
          />
        </Form.Group>

        {error && <Alert variant="danger" role="alert">{error}</Alert>}

        <Button type="submit" disabled={loading}>
          {loading && <Spinner animation="border" size="sm" className="me-2" />}
          {loading ? "Connexion..." : "Se connecter"}
        </Button>

        <p>
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </Form>
    </main>
  );
}

export default Login;