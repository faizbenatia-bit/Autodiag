import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Nav,
  Navbar as BootstrapNavbar,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const initialForm = {
  code: "",
  description: "",
  system: "",
  severity: "medium",
  possibleCauses: "",
  recommendedChecks: "",
};

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "users", label: "Utilisateurs", icon: "👥" },
  { id: "vehicles", label: "Véhicules", icon: "🚗" },
  { id: "obd", label: "Codes OBD", icon: "🔧" },
  { id: "symptoms", label: "Symptômes", icon: "🩺" },
  { id: "rules", label: "Règles", icon: "🧠" },
  { id: "diagnoses", label: "Diagnostics", icon: "📋" },
  { id: "settings", label: "Paramètres", icon: "⚙️" },
];

const roleLabels = {
  user: "Utilisateur",
  mechanic: "Mécanicien",
  admin: "Administrateur",
};

function toList(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readAdmin() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const admin = readAdmin();
  const stats = dashboard?.stats;

  const loadDashboard = async () => {
    const response = await api.get("/admin/stats");
    setDashboard(response.data);
  };

  useEffect(() => {
    let active = true;

    api.get("/admin/stats")
      .then((response) => {
        if (active) setDashboard(response.data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Impossible de charger les données d'administration.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/obd", {
        ...form,
        code: form.code.trim().toUpperCase(),
        possibleCauses: toList(form.possibleCauses),
        recommendedChecks: toList(form.recommendedChecks),
      });
      setSuccess(response.data.message || "Code OBD ajouté.");
      setForm(initialForm);
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Impossible d'ajouter le code OBD.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectSection = (section) => {
    setActiveSection(section);
    setError("");
    setSuccess("");
  };

  const renderTable = (headers, rows, emptyMessage) => (
    rows.length ? (
      <Table responsive hover className="admin-data-table mb-0">
        <thead>
          <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    ) : <p className="admin-empty mb-0">{emptyMessage}</p>
  );

  const renderUsers = () => (
    <Card className="admin-content-card">
      <Card.Body>
        <Card.Title as="h2">Utilisateurs récents</Card.Title>
        {renderTable(
          ["Nom", "Email", "Rôle", "Inscription"],
          (dashboard?.recentUsers || []).map((user) => (
            <tr key={user._id}>
              <td className="fw-semibold">{user.name}</td>
              <td>{user.email}</td>
              <td><Badge bg={user.role === "admin" ? "primary" : "secondary"}>{roleLabels[user.role] || user.role}</Badge></td>
              <td>{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td>
            </tr>
          )),
          "Aucun utilisateur enregistré.",
        )}
      </Card.Body>
    </Card>
  );

  const renderVehicles = () => (
    <Card className="admin-content-card">
      <Card.Body>
        <Card.Title as="h2">Véhicules récemment enregistrés</Card.Title>
        {renderTable(
          ["Véhicule", "Année", "Propriétaire"],
          (dashboard?.recentVehicles || []).map((vehicle) => {
            const owner = vehicle.user || vehicle.owner;
            return (
              <tr key={vehicle._id}>
                <td className="fw-semibold">{vehicle.brand} {vehicle.model}</td>
                <td>{vehicle.year}</td>
                <td>{owner?.name || owner?.email || "—"}</td>
              </tr>
            );
          }),
          "Aucun véhicule enregistré.",
        )}
      </Card.Body>
    </Card>
  );

  const renderOBD = () => (
    <Row className="g-4">
      <Col xl={5}>
        <Card className="admin-content-card h-100">
          <Card.Body>
            <Card.Title as="h2">Ajouter un code OBD</Card.Title>
            <Card.Text className="admin-card-intro">
              Complétez les informations pour enrichir le catalogue AutoDiag.
            </Card.Text>
            <Form className="admin-obd-form" onSubmit={handleSubmit}>
              <Form.Group controlId="obd-code">
                <Form.Label>Code OBD</Form.Label>
                <Form.Control
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  placeholder="P0300"
                  required
                />
              </Form.Group>
              <Form.Group controlId="obd-description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  required
                />
              </Form.Group>
              <Row>
                <Col sm={7}>
                  <Form.Group controlId="obd-system">
                    <Form.Label>Système</Form.Label>
                    <Form.Control
                      value={form.system}
                      onChange={(event) => setForm({ ...form, system: event.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={5}>
                  <Form.Group controlId="obd-severity">
                    <Form.Label>Gravité</Form.Label>
                    <Form.Select
                      value={form.severity}
                      onChange={(event) => setForm({ ...form, severity: event.target.value })}
                    >
                      <option value="low">Faible</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Élevée</option>
                      <option value="critical">Critique</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group controlId="obd-causes">
                <Form.Label>Causes possibles</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.possibleCauses}
                  onChange={(event) => setForm({ ...form, possibleCauses: event.target.value })}
                />
                <Form.Text>Une cause par ligne.</Form.Text>
              </Form.Group>
              <Form.Group controlId="obd-checks">
                <Form.Label>Contrôles recommandés</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.recommendedChecks}
                  onChange={(event) => setForm({ ...form, recommendedChecks: event.target.value })}
                />
                <Form.Text>Un contrôle par ligne.</Form.Text>
              </Form.Group>
              <Button type="submit" disabled={saving}>
                {saving && <Spinner animation="border" size="sm" className="me-2" />}
                {saving ? "Ajout en cours..." : "Ajouter le code OBD"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
      <Col xl={7}>
        <Card className="admin-content-card h-100">
          <Card.Body>
            <Card.Title as="h2">Codes OBD du catalogue</Card.Title>
            {renderTable(
              ["Code", "Description", "Système", "Gravité"],
              (dashboard?.recentOBDCodes || []).map((obd) => (
                <tr key={obd._id}>
                  <td><Badge bg="light" text="dark" className="admin-code-badge">{obd.code}</Badge></td>
                  <td>{obd.description}</td>
                  <td>{obd.system}</td>
                  <td className="text-capitalize">{obd.severity}</td>
                </tr>
              )),
              "Aucun code OBD enregistré.",
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderSymptoms = () => (
    <Card className="admin-content-card">
      <Card.Body>
        <Card.Title as="h2">Symptômes du catalogue</Card.Title>
        {renderTable(
          ["Symptôme", "Catégorie", "Description"],
          (dashboard?.symptoms || []).map((symptom) => (
            <tr key={symptom._id}>
              <td className="fw-semibold">{symptom.name}</td>
              <td><Badge bg="light" text="dark">{symptom.category}</Badge></td>
              <td>{symptom.description || "—"}</td>
            </tr>
          )),
          "Aucun symptôme enregistré.",
        )}
      </Card.Body>
    </Card>
  );

  const renderRules = () => (
    <Card className="admin-content-card">
      <Card.Body>
        <Card.Title as="h2">Règles de diagnostic</Card.Title>
        {renderTable(
          ["Règle", "Description", "Codes OBD", "Gravité", "État"],
          (dashboard?.rules || []).map((rule) => (
            <tr key={rule._id}>
              <td className="fw-semibold">{rule.name}</td>
              <td>{rule.description}</td>
              <td>{[...rule.codesAll, ...rule.codesAny].join(", ") || "—"}</td>
              <td className="text-capitalize">{rule.severity}</td>
              <td><Badge bg={rule.active ? "success" : "secondary"}>{rule.active ? "Active" : "Inactive"}</Badge></td>
            </tr>
          )),
          "Aucune règle de diagnostic enregistrée.",
        )}
      </Card.Body>
    </Card>
  );

  const renderDiagnoses = () => (
    <Card className="admin-content-card">
      <Card.Body>
        <Card.Title as="h2">Diagnostics récents</Card.Title>
        {renderTable(
          ["Code(s) OBD", "Véhicule", "Utilisateur", "Gravité", "Date"],
          (dashboard?.recentDiagnoses || []).map((diagnosis) => (
            <tr key={diagnosis._id}>
              <td>{diagnosis.obdCodes?.join(", ") || "Sans code OBD"}</td>
              <td>
                {diagnosis.vehicle
                  ? `${diagnosis.vehicle.brand} ${diagnosis.vehicle.model}`
                  : "Véhicule supprimé"}
              </td>
              <td>{diagnosis.user?.name || "—"}</td>
              <td className="text-capitalize">{diagnosis.severity}</td>
              <td>{new Date(diagnosis.createdAt).toLocaleDateString("fr-FR")}</td>
            </tr>
          )),
          "Aucun diagnostic enregistré.",
        )}
      </Card.Body>
    </Card>
  );

  const renderDashboard = () => {
    const overview = [
      { title: "Utilisateurs", value: stats?.totalUsers ?? 0, icon: "👥", className: "users" },
      { title: "Véhicules", value: stats?.totalVehicles ?? 0, icon: "🚗", className: "vehicles" },
      { title: "Diagnostics", value: stats?.totalDiagnoses ?? 0, icon: "🩺", className: "diagnoses" },
    ];

    return (
      <>
        <Row xs={1} md={3} className="g-3 g-xl-4 mb-4">
          {overview.map((item) => (
            <Col key={item.title}>
              <Card className={`admin-stat-card admin-stat-${item.className} h-100`}>
                <Card.Body className="d-flex align-items-center gap-3">
                  <span className="admin-stat-icon" aria-hidden="true">{item.icon}</span>
                  <div>
                    <Card.Text className="mb-1">{item.title}</Card.Text>
                    <Card.Title as="strong" className="admin-stat-value">{item.value}</Card.Title>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Card className="admin-content-card admin-diagnostics-card mb-4">
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
              <div>
                <span className="eyebrow mb-1">Activité récente</span>
                <Card.Title as="h2" className="mb-0">Diagnostics récents</Card.Title>
              </div>
              <Button variant="outline-primary" size="sm" onClick={() => selectSection("diagnoses")}>
                Voir tout
              </Button>
            </div>
            {(dashboard?.recentDiagnoses || []).length ? (
              <ListGroup variant="flush" className="admin-diagnosis-list">
                {dashboard.recentDiagnoses.slice(0, 5).map((diagnosis) => (
                  <ListGroup.Item className="admin-diagnosis-item" key={diagnosis._id}>
                    <span className="admin-diagnosis-icon" aria-hidden="true">🩺</span>
                    <div className="admin-diagnosis-summary">
                      <strong>{diagnosis.obdCodes?.join(", ") || "Diagnostic sans code OBD"}</strong>
                      <small>{diagnosis.user?.name || "Utilisateur"}</small>
                    </div>
                    <span className="admin-diagnosis-vehicle">
                      {diagnosis.vehicle
                        ? `${diagnosis.vehicle.brand} ${diagnosis.vehicle.model}`
                        : "Véhicule supprimé"}
                    </span>
                    <time dateTime={diagnosis.createdAt}>
                      {new Date(diagnosis.createdAt).toLocaleDateString("fr-FR")}
                    </time>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : (
              <p className="admin-empty mb-0">Aucun diagnostic récent.</p>
            )}
          </Card.Body>
        </Card>

        <Row xs={2} lg={4} className="g-3">
          {[
            ["Codes OBD", stats?.totalOBDCodes ?? 0],
            ["Symptômes", stats?.totalSymptoms ?? 0],
            ["Règles", stats?.totalRules ?? 0],
            ["Nouveaux utilisateurs ce mois", stats?.newUsersThisMonth ?? 0],
          ].map(([label, value]) => (
            <Col key={label}>
              <Card className="admin-small-stat h-100">
                <Card.Body>
                  <Card.Text>{label}</Card.Text>
                  <Card.Title as="strong">{value}</Card.Title>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    );
  };

  const renderSettings = () => (
    <Card className="admin-content-card">
      <Card.Body>
        <Card.Title as="h2">Paramètres du compte administrateur</Card.Title>
        <dl className="admin-settings-list">
          <div><dt>Nom</dt><dd>{admin?.name || "Administrateur"}</dd></div>
          <div><dt>Adresse email</dt><dd>{admin?.email || "—"}</dd></div>
          <div><dt>Rôle</dt><dd><Badge bg="primary">Administrateur</Badge></dd></div>
        </dl>
        <Card.Text className="admin-card-intro mb-0">
          Les droits d’administration sont vérifiés côté serveur pour chaque opération.
        </Card.Text>
      </Card.Body>
    </Card>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "users": return renderUsers();
      case "vehicles": return renderVehicles();
      case "obd": return renderOBD();
      case "symptoms": return renderSymptoms();
      case "rules": return renderRules();
      case "diagnoses": return renderDiagnoses();
      case "settings": return renderSettings();
      default: return renderDashboard();
    }
  };

  const activeLabel = navigation.find(({ id }) => id === activeSection)?.label;

  return (
    <div className="admin-workspace">
      <BootstrapNavbar expand="lg" className="admin-bootstrap-navbar">
        <Container fluid="xl">
          <BootstrapNavbar.Brand as={Link} to="/admin" className="admin-navbar-brand">
            <span className="brand-mark" aria-hidden="true">AD</span>
            <span>AutoDiag</span>
          </BootstrapNavbar.Brand>
          <div className="admin-navbar-account">
            <span>Admin <span aria-hidden="true">👤</span></span>
            <Button type="button" variant="outline-light" size="sm" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </Container>
      </BootstrapNavbar>

      <Container fluid="xl" className="admin-workspace-container">
        <Row className="g-0 admin-workspace-row">
          <Col lg={3} xl={3} className="admin-nav-column">
            <Nav className="admin-side-nav" variant="pills" aria-label="Navigation d'administration">
              {navigation.map(({ id, label, icon }) => (
                <Nav.Link
                  as="button"
                  type="button"
                  key={id}
                  active={activeSection === id}
                  aria-current={activeSection === id ? "page" : undefined}
                  onClick={() => selectSection(id)}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </Nav.Link>
              ))}
            </Nav>
          </Col>

          <Col lg={9} xl={9} className="admin-content-column">
            <main>
              <Card className="admin-welcome-hero border-0 mb-4">
                <Card.Body>
                  <span className="eyebrow">
                    <span className="eyebrow-dot" aria-hidden="true" />
                    Espace administrateur
                  </span>
                  <h1>{activeSection === "dashboard" ? "Pilotez AutoDiag en un coup d’œil." : activeLabel}</h1>
                  <p>
                    {activeSection === "dashboard"
                      ? "Retrouvez les indicateurs clés et l’activité récente de votre plateforme."
                      : `Consultez et gérez les ${activeLabel?.toLowerCase()} de votre plateforme.`}
                  </p>
                </Card.Body>
              </Card>

              {error && <Alert variant="danger" role="alert">{error}</Alert>}
              {success && <Alert variant="success" role="status">{success}</Alert>}

              {loading ? (
                <div className="admin-loading" role="status">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Chargement du tableau de bord...
                </div>
              ) : dashboard ? renderSection() : (
                <Card className="admin-content-card">
                  <Card.Body>
                    <p className="admin-empty mb-0">Les données d&apos;administration ne sont pas disponibles.</p>
                  </Card.Body>
                </Card>
              )}
            </main>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default AdminDashboard;
