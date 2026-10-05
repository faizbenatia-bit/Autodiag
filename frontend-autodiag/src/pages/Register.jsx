import { useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      const token = response.data.token;

      if (!token) {
        throw new Error("Le serveur n'a pas retourné de token.");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/vehicles", {
        state: { notification: "Utilisateur connecté avec succès." },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Erreur lors de la création du compte"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <Form className="auth-form" onSubmit={handleSubmit}>
        <span className="eyebrow mb-2">Votre espace AutoDiag</span>
        <h1>Créer un compte AutoDiag</h1>
        <p className="auth-intro">Enregistrez vos véhicules et gardez vos diagnostics au même endroit.</p>

        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Nom</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Adresse email</Form.Label>
          <Form.Control
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="password">
          <Form.Label>Mot de passe</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <Form.Text className="text-muted">8 caractères minimum.</Form.Text>
        </Form.Group>

        {error && <Alert variant="danger" role="alert">{error}</Alert>}

        <Button type="submit" disabled={loading}>
          {loading && <Spinner animation="border" size="sm" className="me-2" />}
          {loading ? "Création du compte..." : "Créer mon compte"}
        </Button>

        <p>
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </Form>
    </main>
  );
}

export default Register;
