import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import api from "../api/axios";
import vehicleCatalog from "../data/vehicleCatalog";

const maximumVehicleYear = new Date().getFullYear() + 1;
const otherOption = "__other__";

function Vehicles() {
  // Liste des véhicules
  const [vehicles, setVehicles] = useState([]);

  // Champs du formulaire
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    engine: "",
    customBrand: "",
    customModel: "",
    customEngine: "",
  });

  // États de l'interface
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Récupérer les véhicules
  const fetchVehicles = async () => {
    try {
      const response = await api.get("/vehicles");
      const data = response.data.vehicles ?? response.data;
      if (!Array.isArray(data)) {
        throw new Error("Format de la liste des véhicules invalide.");
      }
      setVehicles(data);
      setLoadError("");
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
          err.message ||
          "Erreur lors du chargement des véhicules.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste au montage
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Modifier un champ
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => {
      if (name === "brand") {
        return {
          ...previous,
          brand: value,
          model: "",
          engine: "",
          customBrand: "",
          customModel: "",
          customEngine: "",
        };
      }

      if (name === "model") {
        return {
          ...previous,
          model: value,
          engine: "",
          customModel: "",
          customEngine: "",
        };
      }

      return { ...previous, [name]: value };
    });
  };

  // Supprimer un véhicule
  const handleDelete = async (id) => {
    // Demander une confirmation
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce véhicule ?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      // Envoyer une requête DELETE
      await api.delete(`/vehicles/${id}`);

      // Actualiser la liste
      await fetchVehicles();

      setSuccess("Véhicule supprimé avec succès.");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la suppression.");
    }
  };

  // Ajouter un véhicule
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Envoyer les données au backend
      await api.post("/vehicles", {
        brand: form.brand === otherOption ? form.customBrand.trim() : form.brand,
        model:
          form.brand === otherOption || form.model === otherOption
            ? form.customModel.trim()
            : form.model,
        year: Number(form.year),
        engine:
          form.brand === otherOption ||
          form.model === otherOption ||
          form.engine === otherOption
            ? form.customEngine.trim()
            : form.engine,
      });

      // Réinitialiser le formulaire
      setForm({
        brand: "",
        model: "",
        year: "",
        engine: "",
        customBrand: "",
        customModel: "",
        customEngine: "",
      });

      // Actualiser la liste
      await fetchVehicles();

      setSuccess("Véhicule ajouté avec succès.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Erreur lors de l'ajout du véhicule.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <header className="page-heading">
        <span className="eyebrow mb-2">Mon garage</span>
        <h1>Gestion de mes véhicules</h1>
        <p>Retrouvez vos véhicules et gardez leurs informations à portée de main.</p>
      </header>

      <Row className="g-4 align-items-start">
        <Col lg={5}>
          <Card className="vehicle-form border-0">
            <Card.Body>
              <h2>Ajouter un véhicule</h2>
              <p className="card-intro">Renseignez les informations principales de votre voiture.</p>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="brand">
                  <Form.Label>Marque</Form.Label>
                  <Form.Control
                    as="select"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionnez une marque</option>
                    {Object.keys(vehicleCatalog).map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                    <option value={otherOption}>Autre marque</option>
                  </Form.Control>
                </Form.Group>

                {form.brand === otherOption && (
                  <Form.Group className="mb-3" controlId="custom-brand">
                    <Form.Label>Nom de la marque</Form.Label>
                    <Form.Control
                      name="customBrand"
                      value={form.customBrand}
                      onChange={handleChange}
                      placeholder="Saisissez la marque"
                      required
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3" controlId="model">
                  <Form.Label>Modèle</Form.Label>
                  {form.brand === otherOption ? (
                    <Form.Control
                      name="customModel"
                      value={form.customModel}
                      onChange={handleChange}
                      placeholder="Saisissez le modèle"
                      required
                    />
                  ) : (
                    <Form.Control
                      as="select"
                      name="model"
                      value={form.model}
                      onChange={handleChange}
                      disabled={!form.brand}
                      required
                    >
                      <option value="">Sélectionnez un modèle</option>
                      {form.brand &&
                        Object.keys(vehicleCatalog[form.brand]).map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      {form.brand && <option value={otherOption}>Autre modèle</option>}
                    </Form.Control>
                  )}
                </Form.Group>

                {form.model === otherOption && form.brand !== otherOption && (
                  <Form.Group className="mb-3" controlId="custom-model">
                    <Form.Label>Nom du modèle</Form.Label>
                    <Form.Control
                      name="customModel"
                      value={form.customModel}
                      onChange={handleChange}
                      placeholder="Saisissez le modèle"
                      required
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3" controlId="year">
                  <Form.Label>Année</Form.Label>
                  <Form.Control
                    name="year"
                    type="number"
                    min="1900"
                    max={maximumVehicleYear}
                    value={form.year}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="engine">
                  <Form.Label>Motorisation <span className="field-optional">(facultatif)</span></Form.Label>
                  {form.brand === otherOption || form.model === otherOption ? (
                    <Form.Control
                      name="customEngine"
                      value={form.customEngine}
                      onChange={handleChange}
                      placeholder="Ex. 1.5 dCi"
                    />
                  ) : (
                    <Form.Control
                      as="select"
                      name="engine"
                      value={form.engine}
                      onChange={handleChange}
                      disabled={!form.model}
                    >
                      <option value="">Sélectionnez une motorisation</option>
                      {(vehicleCatalog[form.brand]?.[form.model] || []).map((engine) => (
                        <option key={engine} value={engine}>{engine}</option>
                      ))}
                      <option value={otherOption}>Autre motorisation</option>
                    </Form.Control>
                  )}
                </Form.Group>

                {form.engine === otherOption && (
                  <Form.Group className="mb-3" controlId="custom-engine">
                    <Form.Label>Précisez la motorisation <span className="field-optional">(facultatif)</span></Form.Label>
                    <Form.Control
                      placeholder="Ex. 1.5 dCi"
                      value={form.customEngine}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, customEngine: event.target.value }))
                      }
                    />
                  </Form.Group>
                )}
                <Form.Text className="mb-3">
                  Les motorisations proposées sont les plus courantes. Vérifiez qu’elles correspondent à l’année de votre véhicule.
                </Form.Text>

                {error && <Alert variant="danger" role="alert">{error}</Alert>}
                {success && <Alert variant="success" role="status">{success}</Alert>}

                <Button type="submit" className="w-100" disabled={saving}>
                  {saving && <Spinner animation="border" size="sm" className="me-2" />}
                  {saving ? "Enregistrement..." : "Ajouter le véhicule"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <section className="vehicle-section">
            <div className="vehicle-section-heading">
              <div>
                <h2>Mes véhicules</h2>
                <p>Votre garage en un coup d’œil.</p>
              </div>
              <span className="vehicle-count">{vehicles.length}</span>
            </div>

            {loading ? (
              <div className="loading-state" role="status">
                <Spinner animation="border" size="sm" />
                <span>Chargement des véhicules...</span>
              </div>
            ) : loadError ? (
              <Alert variant="danger" className="mb-0">
                <p className="mb-3">{loadError}</p>
                <Button type="button" variant="outline-danger" onClick={fetchVehicles}>
                  Réessayer
                </Button>
              </Alert>
            ) : vehicles.length === 0 ? (
              <div className="vehicle-empty">
                <div className="empty-mark" aria-hidden="true">+</div>
                <h3>Votre garage est vide</h3>
                <p>Ajoutez votre premier véhicule pour pouvoir lancer un diagnostic.</p>
              </div>
            ) : (
              <div className="vehicle-list">
                {vehicles.map((vehicle) => (
                  <Card className="vehicle-card border-0" key={vehicle._id}>
                    <Card.Body>
                      <div className="vehicle-card-heading">
                        <div className="vehicle-icon" aria-hidden="true">AD</div>
                        <div>
                          <h3>{vehicle.brand} {vehicle.model}</h3>
                          <p className="vehicle-year">{vehicle.year}</p>
                        </div>
                      </div>
                      <div className="vehicle-engine">
                        <span>Motorisation</span>
                        <strong>{vehicle.engine || "Non précisée"}</strong>
                      </div>
                      <Button
                        type="button"
                        variant="outline-danger"
                        className="delete-btn"
                        onClick={() => handleDelete(vehicle._id)}
                      >
                        Supprimer
                      </Button>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </Col>
      </Row>
    </main>
  );
}

export default Vehicles;
