// Importation des hooks React nécessaires
import { useEffect, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";

// Importation du client Axios configuré
import api from "../api/axios";

const severityLabels = {
  low: "Faible",
  medium: "Modéré",
  high: "Élevé",
  critical: "Critique",
  unknown: "À déterminer",
};

function Diagnosis() {
  // Liste des véhicules de l'utilisateur
  const [vehicles, setVehicles] = useState([]);

  // Informations saisies dans le formulaire
  const [vehicleId, setVehicleId] = useState("");
  const [obdCodes, setObdCodes] = useState("");

  // États de gestion de l'interface
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Charger les véhicules au démarrage de la page
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await api.get("/vehicles");

        // Vérifier la structure renvoyée par l'API
        const data = response.data.vehicles || response.data;

        setVehicles(data);

        // Sélectionner automatiquement le premier véhicule
        if (data.length > 0) {
          setVehicleId(data[0]._id);
        }
      } catch {
        setError("Impossible de charger les véhicules.");
      }
    };

    fetchVehicles();
  }, []);

  // Envoyer les informations au backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setResult(null);

    if (!vehicleId) {
      setError("Veuillez sélectionner un véhicule.");
      return;
    }

    if (obdCodes.trim() === "") {
      setError("Saisissez au moins un code OBD-II.");
      return;
    }

    // Transformer le texte des codes en tableau
    const codes = obdCodes
      .split(",")
      .map((code) => code.trim().toUpperCase())
      .filter((code) => code !== "");

    // Données envoyées à l'API
    const diagnosisData = {
      vehicleId,
      obdCodes: codes,
    };

    try {
      setLoading(true);

      const response = await api.post("/diagnosis", diagnosisData);

      setResult({
        ...response.data,
        submittedCodes: codes,
        selectedVehicle: vehicles.find((vehicle) => vehicle._id === vehicleId),
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Une erreur est survenue pendant le diagnostic."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="diagnosis-page">
      <header className="page-heading">
        <span className="eyebrow mb-2">Analyse guidée</span>
        <h1>Diagnostic automobile</h1>
        <p>Saisissez les codes OBD-II du véhicule pour obtenir des pistes à vérifier.</p>
      </header>

      <Form className="diagnosis-form" onSubmit={handleSubmit}>
        <Form.Group controlId="vehicle">
          <Form.Label>Véhicule</Form.Label>
          <Form.Select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            required
          >
            <option value="">Sélectionner un véhicule</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </option>
            ))}
          </Form.Select>
          {vehicles.length === 0 && (
            <Form.Text className="text-muted">
              Ajoutez un véhicule dans votre garage avant de lancer un diagnostic.
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group controlId="obdCodes">
          <Form.Label>Codes OBD-II</Form.Label>
          <Form.Control
            type="text"
            value={obdCodes}
            onChange={(e) => setObdCodes(e.target.value)}
            placeholder="Ex. : P0300, P0420"
            required
          />
          <Form.Text className="text-muted">
            Séparez les codes par des virgules si vous en avez plusieurs.
          </Form.Text>
        </Form.Group>

        {error && <Alert variant="danger" className="mb-0" role="alert">{error}</Alert>}

        <Button type="submit" disabled={loading || vehicles.length === 0}>
          {loading && <Spinner animation="border" size="sm" className="me-2" />}
          {loading ? "Analyse en cours..." : "Lancer le diagnostic"}
        </Button>
      </Form>

      {/* Affichage du résultat */}
      {result && (
        <section className="diagnosis-result">
          {(() => {
            const diagnosis = result.diagnosis || {};
            const findings = Array.isArray(diagnosis.findings)
              ? diagnosis.findings
              : diagnosis.findings
                ? [diagnosis.findings]
                : [];
            const codeDetails = result.codeDetails || [];
            const causes =
              diagnosis.possibleCauses?.length > 0
                ? diagnosis.possibleCauses
                : [...new Set(codeDetails.flatMap((code) => code.possibleCauses || []))];
            const recommendations =
              diagnosis.recommendations?.length > 0
                ? diagnosis.recommendations
                : [...new Set(codeDetails.flatMap((code) => code.recommendations || []))];
            const severity =
              diagnosis.severity && diagnosis.severity !== "unknown"
                ? diagnosis.severity
                : codeDetails[0]?.severity || "unknown";
            const problem =
              findings[0]?.name ||
              codeDetails[0]?.description ||
              "Aucun problème identifié";
            const codes =
              diagnosis.obdCodes?.length > 0
                ? diagnosis.obdCodes
                : result.submittedCodes;
            return (
              <>
                <header className="diagnosis-result-header">
                  <h2>🔧 Résultat du diagnostic</h2>
                </header>

                <section className="diagnosis-result-vehicle">
                  <h3>🚗 Véhicule</h3>
                  <p>
                    {result.selectedVehicle
                      ? `${result.selectedVehicle.brand} ${result.selectedVehicle.model} - ${result.selectedVehicle.year}`
                      : "Véhicule sélectionné"}
                  </p>
                </section>

                <section className="diagnosis-result-problem">
                  <h3>⚠️ Problème détecté</h3>
                  <p className="diagnosis-problem-name">{problem}</p>
                  {codes.length > 0 && (
                    <p>
                      <strong>Code OBD-II :</strong> {codes.join(", ")}
                    </p>
                  )}
                  <p>
                    <strong>Niveau :</strong>{" "}
                    {severityLabels[severity] || severity}
                  </p>
                </section>

                {causes.length > 0 && (
                  <section className="diagnosis-result-section">
                    <h3>Causes possibles</h3>
                    <ol>
                      {causes.map((cause) => (
                        <li key={cause}>{cause}</li>
                      ))}
                    </ol>
                  </section>
                )}

                {recommendations.length > 0 && (
                  <section className="diagnosis-result-section">
                    <h3>🔧 Recommandations</h3>
                    <ul>
                      {recommendations.map((recommendation) => (
                        <li key={recommendation}>{recommendation}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {result.warnings?.unknownCodes?.length > 0 && (
                  <p className="diagnosis-result-note">
                    Codes non reconnus : {result.warnings.unknownCodes.join(", ")}
                  </p>
                )}
              </>
            );
          })()}
        </section>
      )}
    </main>
  );
}

export default Diagnosis;