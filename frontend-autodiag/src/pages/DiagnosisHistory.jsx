import { useEffect, useState } from "react";
import { Alert, Badge, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../api/axios";

const severityLabels = {
  low: "Faible",
  medium: "Modéré",
  high: "Élevé",
  critical: "Critique",
  unknown: "À déterminer",
};

const formatDate = (date) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));

const loadDiagnoses = async () => {
  const response = await api.get("/diagnosis");
  const data = response.data.diagnoses;

  if (!Array.isArray(data)) {
    throw new Error("Format de l’historique invalide.");
  }

  return data;
};

const getLoadErrorMessage = (err) =>
  err.response?.data?.message ||
  err.message ||
  "Impossible de charger l’historique des diagnostics.";

function DiagnosisHistory() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [clearingHistory, setClearingHistory] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchDiagnoses = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
      setError("");
    }

    try {
      setDiagnoses(await loadDiagnoses());
    } catch (err) {
      setError(getLoadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    loadDiagnoses()
      .then((data) => {
        if (isActive) setDiagnoses(data);
      })
      .catch((err) => {
        if (isActive) setError(getLoadErrorMessage(err));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const toggleDetails = async (diagnosisId) => {
    if (expandedId === diagnosisId) {
      setExpandedId("");
      setSelectedDiagnosis(null);
      setDetailError("");
      return;
    }

    setExpandedId(diagnosisId);
    setSelectedDiagnosis(null);
    setDetailError("");
    setDetailLoading(true);

    try {
      const response = await api.get(`/diagnosis/${diagnosisId}`);
      setSelectedDiagnosis(response.data);
    } catch (err) {
      setDetailError(
        err.response?.data?.message ||
          "Impossible de charger le détail de ce diagnostic.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteDiagnosis = async (diagnosisId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce diagnostic ?")) {
      return;
    }

    setDeletingId(diagnosisId);
    setActionError("");
    setActionSuccess("");

    try {
      await api.delete(`/diagnosis/${diagnosisId}`);
      setDiagnoses((current) =>
        current.filter((diagnosis) => diagnosis._id !== diagnosisId),
      );
      if (expandedId === diagnosisId) {
        setExpandedId("");
        setSelectedDiagnosis(null);
      }
      setActionSuccess("Diagnostic supprimé.");
    } catch (err) {
      setActionError(
        err.response?.data?.message || "Impossible de supprimer ce diagnostic.",
      );
    } finally {
      setDeletingId("");
    }
  };

  const handleClearHistory = async () => {
    if (
      !window.confirm(
        `Effacer les ${diagnoses.length} diagnostics de votre historique ? Cette action est définitive.`,
      )
    ) {
      return;
    }

    setClearingHistory(true);
    setActionError("");
    setActionSuccess("");

    try {
      await api.delete("/diagnosis");
      setDiagnoses([]);
      setExpandedId("");
      setSelectedDiagnosis(null);
      setActionSuccess("Tout l’historique a été supprimé.");
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
          "Impossible d’effacer l’historique.",
      );
    } finally {
      setClearingHistory(false);
    }
  };

  return (
    <main className="history-page">
      <header className="history-header">
        <div>
          <h1>Historique des diagnostics</h1>
          <p>Retrouvez les pré-diagnostics réalisés pour vos véhicules.</p>
        </div>
        <Link to="/diagnosis" className="history-new-link">
          Nouveau diagnostic
        </Link>
      </header>

      {actionError && <Alert variant="danger" role="alert">{actionError}</Alert>}
      {actionSuccess && <Alert variant="success" role="status">{actionSuccess}</Alert>}

      {loading ? (
        <div className="loading-state" role="status">
          <Spinner animation="border" size="sm" />
          <span>Chargement de l’historique...</span>
        </div>
      ) : error ? (
        <div className="history-message">
          <Alert variant="danger" role="alert">{error}</Alert>
          <Button type="button" onClick={fetchDiagnoses}>
            Réessayer
          </Button>
        </div>
      ) : diagnoses.length === 0 ? (
        <section className="history-empty">
          <h2>Aucun diagnostic pour le moment</h2>
          <p>Votre prochain pré-diagnostic apparaîtra ici.</p>
          <Button as={Link} to="/diagnosis">Lancer un diagnostic</Button>
        </section>
      ) : (
        <>
          <div className="history-toolbar">
            <p>{diagnoses.length} diagnostic(s) dans votre historique</p>
            <Button
              type="button"
              variant="outline-danger"
              className="history-delete-all"
              onClick={handleClearHistory}
              disabled={clearingHistory || Boolean(deletingId)}
            >
              {clearingHistory && <Spinner animation="border" size="sm" className="me-2" />}
              {clearingHistory ? "Suppression..." : "Effacer tout l’historique"}
            </Button>
          </div>
          <section className="history-list" aria-label="Diagnostics précédents">
            {diagnoses.map((diagnosis) => {
            const isExpanded = expandedId === diagnosis._id;
            const vehicle = diagnosis.vehicle;

            return (
              <article className="history-card" key={diagnosis._id}>
                <div className="history-card-summary">
                  <div>
                    <h2>
                      {vehicle
                        ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})`
                        : "Véhicule"}
                    </h2>
                    <p>{formatDate(diagnosis.createdAt)}</p>
                    <p>
                      {diagnosis.obdCodes?.length || 0} code(s) OBD-II
                    </p>
                  </div>
                  <div className="history-card-action">
                    <Badge
                      className={`severity-badge severity-${diagnosis.severity || "unknown"}`}
                    >
                      {severityLabels[diagnosis.severity] || "À déterminer"}
                    </Badge>
                    <Button
                      type="button"
                      variant="primary"
                      aria-expanded={isExpanded}
                      onClick={() => toggleDetails(diagnosis._id)}
                    >
                      {isExpanded ? "Masquer le détail" : "Voir le détail"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline-danger"
                      className="history-delete-one"
                      onClick={() => handleDeleteDiagnosis(diagnosis._id)}
                      disabled={clearingHistory || Boolean(deletingId)}
                    >
                      {deletingId === diagnosis._id && <Spinner animation="border" size="sm" className="me-2" />}
                      {deletingId === diagnosis._id ? "Suppression..." : "Supprimer"}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="history-card-details">
                    {detailLoading && (
                      <div className="loading-state" role="status">
                        <Spinner animation="border" size="sm" />
                        <span>Chargement du détail...</span>
                      </div>
                    )}
                    {detailError && <Alert variant="danger" role="alert">{detailError}</Alert>}
                    {selectedDiagnosis?._id === diagnosis._id && (
                      <>
                        {selectedDiagnosis.obdCodes?.length > 0 && (
                          <section>
                            <h3>Codes OBD-II</h3>
                            <p>{selectedDiagnosis.obdCodes.join(", ")}</p>
                          </section>
                        )}
                        {selectedDiagnosis.findings?.length > 0 && (
                          <section>
                            <h3>Résultats</h3>
                            <ul>
                              {selectedDiagnosis.findings.map((finding, index) => (
                                <li key={`${finding.name}-${index}`}>
                                  <strong>{finding.name}</strong>
                                  {finding.description && ` — ${finding.description}`}
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                        {selectedDiagnosis.possibleCauses?.length > 0 && (
                          <section>
                            <h3>Causes possibles</h3>
                            <ul>
                              {selectedDiagnosis.possibleCauses.map((cause) => (
                                <li key={cause}>{cause}</li>
                              ))}
                            </ul>
                          </section>
                        )}
                        {selectedDiagnosis.recommendations?.length > 0 && (
                          <section>
                            <h3>Recommandations</h3>
                            <ul>
                              {selectedDiagnosis.recommendations.map((recommendation) => (
                                <li key={recommendation}>{recommendation}</li>
                              ))}
                            </ul>
                          </section>
                        )}
                        <p className="history-disclaimer">
                          Ce résultat est un pré-diagnostic et ne remplace pas
                          l’avis d’un mécanicien.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
            })}
          </section>
        </>
      )}
    </main>
  );
}

export default DiagnosisHistory;
