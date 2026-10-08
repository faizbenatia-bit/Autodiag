import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  Form,
  ListGroup,
  Nav,
  Navbar as BootstrapNavbar,
  Modal,
  Pagination,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const initialForm = {
  code: "",
  summary: "",
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

const obdSeverityLabels = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
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
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesPage, setVehiclesPage] = useState(1);
  const [vehiclesTotalPages, setVehiclesTotalPages] = useState(1);
  const [vehiclesTotal, setVehiclesTotal] = useState(0);
  const [vehiclesSearch, setVehiclesSearch] = useState("");
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [obdCodes, setObdCodes] = useState([]);
  const [obdPage, setObdPage] = useState(1);
  const [obdTotalPages, setObdTotalPages] = useState(1);
  const [obdTotal, setObdTotal] = useState(0);
  const [obdSearch, setObdSearch] = useState("");
  const [obdSeverity, setObdSeverity] = useState("");
  const [obdLoading, setObdLoading] = useState(true);
  const [obdRefreshKey, setObdRefreshKey] = useState(0);
  const [editingObd, setEditingObd] = useState(null);
  const [deletingObd, setDeletingObd] = useState(null);
  const [obdActionLoading, setObdActionLoading] = useState(false);
  const [obdActionError, setObdActionError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [userModal, setUserModal] = useState("");
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userActionError, setUserActionError] = useState("");
  const [editUser, setEditUser] = useState({ name: "", email: "" });
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

  useEffect(() => {
    if (activeSection !== "users") return undefined;

    let active = true;
    api.get("/admin/users", { params: { page: usersPage, limit: 20 } })
      .then((response) => {
        if (!active) return;
        setUsers(response.data.users);
        setUsersTotalPages(response.data.totalPages);
        setUsersTotal(response.data.totalUsers);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Impossible de charger les utilisateurs.",
          );
        }
      })
      .finally(() => {
        if (active) setUsersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeSection, usersPage]);

  useEffect(() => {
    if (activeSection !== "vehicles") return undefined;

    let active = true;
    const timeout = setTimeout(() => {
      setVehiclesLoading(true);
      api.get("/admin/vehicles", {
        params: { page: vehiclesPage, limit: 20, search: vehiclesSearch },
      })
        .then((response) => {
          if (!active) return;
          setVehicles(response.data.vehicles);
          setVehiclesTotalPages(response.data.totalPages);
          setVehiclesTotal(response.data.totalVehicles);
        })
        .catch((err) => {
          if (active) {
            setError(
              err.response?.data?.message ||
                err.message ||
                "Impossible de charger les véhicules.",
            );
          }
        })
        .finally(() => {
          if (active) setVehiclesLoading(false);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [activeSection, vehiclesPage, vehiclesSearch]);

  useEffect(() => {
    if (activeSection !== "obd") return undefined;

    let active = true;
    const timeout = setTimeout(() => {
      api.get("/admin/obd", {
        params: {
          page: obdPage,
          limit: 10,
          search: obdSearch,
          severity: obdSeverity,
        },
      })
        .then((response) => {
          if (!active) return;
          setObdCodes(response.data.codes);
          setObdTotalPages(response.data.totalPages);
          setObdTotal(response.data.totalCodes);
        })
        .catch((err) => {
          if (active) {
            setError(
              err.response?.data?.message ||
                err.message ||
                "Impossible de charger les codes OBD.",
            );
          }
        })
        .finally(() => {
          if (active) setObdLoading(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [activeSection, obdPage, obdSearch, obdSeverity, obdRefreshKey]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", {
      replace: true,
      state: { notification: "Admin déconnecté." },
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const codeData = {
      ...form,
      code: form.code.trim().toUpperCase(),
      possibleCauses: toList(form.possibleCauses),
      recommendedChecks: toList(form.recommendedChecks),
    };
    let response;
    try {
      response = editingObd
        ? await api.patch(`/admin/obd/${editingObd._id}`, {
              summary: codeData.summary,
              description: codeData.description,
            system: codeData.system,
            severity: codeData.severity,
            possibleCauses: codeData.possibleCauses,
            recommendedChecks: codeData.recommendedChecks,
          })
        : await api.post("/obd", codeData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          (editingObd
            ? "Impossible de modifier le code OBD."
            : "Impossible d'ajouter le code OBD."),
      );
      setSaving(false);
      return;
    }

    const wasEditing = Boolean(editingObd);
    setSuccess(response.data.message || (wasEditing ? "Code OBD modifié." : "Code OBD ajouté."));
    setForm(initialForm);
    setEditingObd(null);
    setObdPage(1);
    setObdLoading(true);
    setObdRefreshKey((key) => key + 1);
    try {
      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Le code a été enregistré, mais le tableau de bord n'a pas pu être actualisé.",
      );
    } finally {
      setSaving(false);
    }
  };

  const openEditObd = (obd) => {
    setEditingObd(obd);
    setForm({
      code: obd.code,
      summary: obd.summary || obd.description,
      description: obd.description,
      system: obd.system,
      severity: obd.severity,
      possibleCauses: (obd.possibleCauses || []).join("\n"),
      recommendedChecks: (obd.recommendedChecks || []).join("\n"),
    });
    setError("");
    setSuccess("");
  };

  const cancelEditObd = () => {
    setEditingObd(null);
    setForm(initialForm);
    setError("");
  };

  const handleDeleteObd = async () => {
    if (!deletingObd) return;
    setObdActionLoading(true);
    setObdActionError("");
    setError("");
    setSuccess("");
    try {
      const response = await api.delete(`/admin/obd/${deletingObd._id}`);
      setSuccess(response.data.message || "Code OBD supprimé.");
      setDeletingObd(null);
      setObdLoading(true);
      if (obdCodes.length === 1 && obdPage > 1) {
        setObdPage((page) => page - 1);
      } else {
        setObdRefreshKey((key) => key + 1);
      }
      try {
        await loadDashboard();
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Le code a été supprimé, mais le tableau de bord n'a pas pu être actualisé.",
        );
      }
    } catch (err) {
      setObdActionError(
        err.response?.data?.message ||
          err.message ||
          "Impossible de supprimer le code OBD.",
      );
    } finally {
      setObdActionLoading(false);
    }
  };

  const selectSection = (section) => {
    setActiveSection(section);
    if (section === "users") setUsersPage(1);
    setError("");
    setSuccess("");
  };

  const refreshUserManagement = async () => {
    const requests = [
      api.get("/admin/stats"),
      api.get("/admin/users", { params: { page: usersPage, limit: 20 } }),
    ];
    const [dashboardResponse, usersResponse] = await Promise.all(requests);
    setDashboard(dashboardResponse.data);
    setUsers(usersResponse.data.users);
    setUsersTotalPages(usersResponse.data.totalPages);
    setUsersTotal(usersResponse.data.totalUsers);
    setUsersPage((page) => Math.min(page, Math.max(usersResponse.data.totalPages, 1)));
  };

  const openUserView = async (user, view) => {
    setUserActionError("");
    setSelectedUser(user);
    setUserModal(view);
    setUserDetails(null);
    setUserActionLoading(true);
    try {
      const response = await api.get(`/admin/users/${user._id}`);
      setUserDetails(response.data);
    } catch (err) {
      setUserActionError(
        err.response?.data?.message ||
          err.message ||
          "Impossible de charger les informations du compte.",
      );
    } finally {
      setUserActionLoading(false);
    }
  };

  const openEditUser = (user) => {
    setSelectedUser(user);
    setEditUser({ name: user.name, email: user.email });
    setUserActionError("");
    setUserModal("edit");
  };

  const handleEditUser = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    setUserActionLoading(true);
    setUserActionError("");
    try {
      await api.patch(`/admin/users/${selectedUser._id}`, editUser);
      await refreshUserManagement();
      setSuccess("Le compte utilisateur a été modifié.");
      setUserModal("");
    } catch (err) {
      setUserActionError(
        err.response?.data?.message ||
          err.message ||
          "Impossible de modifier le compte.",
      );
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!selectedUser) return;
    setUserActionLoading(true);
    setUserActionError("");
    try {
      if (userModal === "delete") {
        await api.delete(`/admin/users/${selectedUser._id}`);
        setSuccess("Le compte et ses données associées ont été supprimés.");
      } else {
        const isActive = userModal === "reactivate";
        await api.patch(`/admin/users/${selectedUser._id}/status`, { isActive });
        setSuccess(isActive ? "Le compte a été réactivé." : "Le compte a été désactivé.");
      }
      await refreshUserManagement();
      setUserModal("");
      setSelectedUser(null);
      setUserDetails(null);
    } catch (err) {
      setUserActionError(
        err.response?.data?.message ||
          err.message ||
          "L'action sur le compte a échoué.",
      );
    } finally {
      setUserActionLoading(false);
    }
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
        <div className="admin-users-heading">
          <div>
            <Card.Title as="h2">Gestion des utilisateurs</Card.Title>
            <Card.Text className="admin-card-intro">
              {usersTotal} compte{usersTotal === 1 ? "" : "s"} utilisateur{usersTotal === 1 ? "" : "s"}
            </Card.Text>
          </div>
        </div>
        {usersLoading ? (
          <div className="admin-loading" role="status">
            <Spinner animation="border" size="sm" className="me-2" />
            Chargement des utilisateurs...
          </div>
        ) : renderTable(
          ["Nom", "Email", "Rôle", "Véhicules", "Diagnostics", "État", "Inscription", "Actions"],
          users.map((user) => (
            <tr key={user._id}>
              <td className="fw-semibold">{user.name}</td>
              <td>{user.email}</td>
              <td><Badge bg="secondary">{roleLabels[user.role] || user.role}</Badge></td>
              <td>{user.vehicleCount}</td>
              <td>{user.diagnosisCount}</td>
              <td>
                <Badge bg={user.isActive ? "success" : "secondary"}>
                  {user.isActive ? "Actif" : "Désactivé"}
                </Badge>
              </td>
              <td>{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td>
              <td>
                <Dropdown>
                  <Dropdown.Toggle size="sm" variant="outline-primary" className="admin-user-actions">
                    Actions
                  </Dropdown.Toggle>
                  <Dropdown.Menu align="end">
                    <Dropdown.Item onClick={() => openUserView(user, "profile")}>👁️ Voir le profil</Dropdown.Item>
                    <Dropdown.Item onClick={() => openUserView(user, "vehicles")}>🚗 Voir les véhicules</Dropdown.Item>
                    <Dropdown.Item onClick={() => openUserView(user, "diagnoses")}>📋 Voir les diagnostics</Dropdown.Item>
                    <Dropdown.Item onClick={() => openEditUser(user)}>✏️ Modifier</Dropdown.Item>
                    <Dropdown.Divider />
                    {user.isActive ? (
                      <Dropdown.Item
                        className="text-warning-emphasis"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserActionError("");
                          setUserModal("deactivate");
                        }}
                      >
                        🔒 Désactiver
                      </Dropdown.Item>
                    ) : (
                      <Dropdown.Item
                        className="text-success"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserActionError("");
                          setUserModal("reactivate");
                        }}
                      >
                        🔓 Réactiver
                      </Dropdown.Item>
                    )}
                    <Dropdown.Item
                      className="text-danger"
                      onClick={() => {
                        setSelectedUser(user);
                        setUserActionError("");
                        setUserModal("delete");
                      }}
                    >
                      🗑️ Supprimer
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </td>
            </tr>
          )),
          "Aucun compte utilisateur.",
        )}
        {usersTotalPages > 1 && (
          <Pagination className="admin-users-pagination mb-0">
            <Pagination.Prev
              disabled={usersPage <= 1 || usersLoading}
              onClick={() => {
                setUsersLoading(true);
                setUsersPage((page) => Math.max(1, page - 1));
              }}
            />
            {Array.from({ length: usersTotalPages }, (_, index) => index + 1).map((page) => (
              <Pagination.Item
                key={page}
                active={page === usersPage}
                disabled={usersLoading}
                onClick={() => {
                  if (page !== usersPage) {
                    setUsersLoading(true);
                    setUsersPage(page);
                  }
                }}
              >
                {page}
              </Pagination.Item>
            ))}
            <Pagination.Next
              disabled={usersPage >= usersTotalPages || usersLoading}
              onClick={() => {
                setUsersLoading(true);
                setUsersPage((page) => Math.min(usersTotalPages, page + 1));
              }}
            />
          </Pagination>
        )}
      </Card.Body>
    </Card>
  );

  const renderVehicles = () => (
    <Card className="admin-content-card">
      <Card.Body>
        <div className="admin-users-heading admin-vehicles-heading">
          <div>
            <Card.Title as="h2">Parc de véhicules</Card.Title>
            <Card.Text className="admin-card-intro">
              {vehiclesTotal} véhicule{vehiclesTotal === 1 ? "" : "s"} enregistré{vehiclesTotal === 1 ? "" : "s"}
            </Card.Text>
          </div>
          <Form.Control
            type="search"
            className="admin-vehicles-search"
            placeholder="Rechercher un véhicule ou propriétaire"
            aria-label="Rechercher un véhicule ou propriétaire"
            value={vehiclesSearch}
            onChange={(event) => {
              setVehiclesSearch(event.target.value);
              setVehiclesPage(1);
              setVehiclesLoading(true);
              setError("");
            }}
          />
        </div>
        {vehiclesLoading ? (
          <div className="admin-loading" role="status">
            <Spinner animation="border" size="sm" className="me-2" />
            Chargement des véhicules...
          </div>
        ) : renderTable(
          ["Véhicule", "Année", "Motorisation", "Propriétaire", "Ajouté le"],
          vehicles.map((vehicle) => {
            const owner = vehicle.user || vehicle.owner;
            return (
              <tr key={vehicle._id}>
                <td className="fw-semibold">{vehicle.brand} {vehicle.model}</td>
                <td>{vehicle.year}</td>
                <td>{vehicle.engine || "—"}</td>
                <td>{owner?.name || owner?.email || "—"}</td>
                <td>{vehicle.createdAt ? new Date(vehicle.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            );
          }),
          vehiclesSearch
            ? "Aucun véhicule ne correspond à cette recherche."
            : "Aucun véhicule enregistré.",
        )}
        {vehiclesTotalPages > 1 && (
          <Pagination className="admin-users-pagination mb-0" aria-label="Pagination des véhicules">
            <Pagination.Prev
              disabled={vehiclesPage <= 1 || vehiclesLoading}
              onClick={() => {
                setVehiclesLoading(true);
                setVehiclesPage((page) => Math.max(1, page - 1));
              }}
            />
            <Pagination.Item active disabled>
              {vehiclesPage} / {vehiclesTotalPages}
            </Pagination.Item>
            <Pagination.Next
              disabled={vehiclesPage >= vehiclesTotalPages || vehiclesLoading}
              onClick={() => {
                setVehiclesLoading(true);
                setVehiclesPage((page) => Math.min(vehiclesTotalPages, page + 1));
              }}
            />
          </Pagination>
        )}
      </Card.Body>
    </Card>
  );

  const renderOBD = () => (
    <Row className="g-4">
      <Col xs={12} xxl={5}>
        <Card className="admin-content-card">
          <Card.Body>
            <Card.Title as="h2">{editingObd ? "Modifier un code OBD" : "Ajouter un code OBD"}</Card.Title>
            <Card.Text className="admin-card-intro">
              {editingObd
                ? "Mettez à jour les informations de ce code dans le catalogue AutoDiag."
                : "Complétez les informations pour enrichir le catalogue AutoDiag."}
            </Card.Text>
            <Form className="admin-obd-form" onSubmit={handleSubmit}>
              <Form.Group controlId="obd-code">
                <Form.Label>Code OBD</Form.Label>
                <Form.Control
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  placeholder="P0300"
                  disabled={Boolean(editingObd)}
                  required
                />
                {editingObd && <Form.Text>Le code est l’identifiant du catalogue et ne peut pas être modifié.</Form.Text>}
              </Form.Group>
              <Form.Group controlId="obd-summary">
                <Form.Label>Résumé</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={form.summary}
                  onChange={(event) => setForm({ ...form, summary: event.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group controlId="obd-description">
                <Form.Label>Description détaillée</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
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
                {saving
                  ? editingObd ? "Modification en cours..." : "Ajout en cours..."
                  : editingObd ? "Enregistrer les modifications" : "Ajouter le code OBD"}
              </Button>
              {editingObd && (
                <Button type="button" variant="outline-secondary" onClick={cancelEditObd} disabled={saving}>
                  Annuler la modification
                </Button>
              )}
            </Form>
          </Card.Body>
        </Card>
      </Col>
      <Col xs={12} xxl={7}>
        <Card className="admin-content-card h-100">
          <Card.Body>
            <div className="admin-users-heading admin-obd-heading">
              <div>
                <Card.Title as="h2">Catalogue des codes OBD</Card.Title>
                <Card.Text className="admin-card-intro">
                  {obdTotal} code{obdTotal === 1 ? "" : "s"} au catalogue
                </Card.Text>
              </div>
              <div className="admin-obd-filters">
                <Form.Control
                  type="search"
                  className="admin-vehicles-search"
                  placeholder="Code, description ou système"
                  aria-label="Rechercher dans les codes OBD"
                  value={obdSearch}
                  onChange={(event) => {
                    setObdSearch(event.target.value);
                    setObdPage(1);
                    setObdLoading(true);
                    setError("");
                  }}
                />
                <Form.Select
                  className="admin-obd-severity-filter"
                  aria-label="Filtrer les codes OBD par gravité"
                  value={obdSeverity}
                  onChange={(event) => {
                    setObdSeverity(event.target.value);
                    setObdPage(1);
                    setObdLoading(true);
                    setError("");
                  }}
                >
                  <option value="">Toutes les gravités</option>
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                  <option value="critical">Critique</option>
                </Form.Select>
              </div>
            </div>
            {obdLoading ? (
              <div className="admin-loading" role="status">
                <Spinner animation="border" size="sm" className="me-2" />
                Chargement des codes OBD...
              </div>
            ) : renderTable(
              ["Code", "Description", "Système", "Gravité", "Actions"],
              obdCodes.map((obd) => (
                <tr key={obd._id}>
                  <td><Badge bg="light" text="dark" className="admin-code-badge">{obd.code}</Badge></td>
                  <td>
                      <div>{obd.summary || obd.description}</div>
                      {obd.summary && obd.description && obd.summary !== obd.description && (
                        <details className="admin-obd-details">
                          <summary>Description détaillée</summary>
                          <p>{obd.description}</p>
                        </details>
                      )}
                      {(obd.possibleCauses?.length > 0 || obd.recommendedChecks?.length > 0) && (
                        <details className="admin-obd-details">
                          <summary>Causes et contrôles</summary>
                          {obd.possibleCauses?.length > 0 && (
                            <div>
                              <strong>Causes possibles</strong>
                              <ul>{obd.possibleCauses.map((cause, index) => <li key={`${index}-${cause}`}>{cause}</li>)}</ul>
                            </div>
                          )}
                          {obd.recommendedChecks?.length > 0 && (
                            <div>
                              <strong>Contrôles recommandés</strong>
                              <ul>{obd.recommendedChecks.map((check, index) => <li key={`${index}-${check}`}>{check}</li>)}</ul>
                            </div>
                          )}
                        </details>
                      )}
                  </td>
                  <td>{obd.system}</td>
                  <td>
                      <Badge
                        bg={{
                          low: "success",
                          medium: "info",
                          high: "warning",
                          critical: "danger",
                        }[obd.severity] || "secondary"}
                        text={["medium", "high"].includes(obd.severity) ? "dark" : undefined}
                      >
                        {obdSeverityLabels[obd.severity] || obd.severity}
                      </Badge>
                  </td>
                  <td>
                    <Dropdown>
                      <Dropdown.Toggle size="sm" variant="outline-primary" className="admin-user-actions">
                        Actions
                      </Dropdown.Toggle>
                      <Dropdown.Menu align="end">
                        <Dropdown.Item onClick={() => openEditObd(obd)}>✏️ Modifier</Dropdown.Item>
                        <Dropdown.Item
                          className="text-danger"
                          onClick={() => {
                            setDeletingObd(obd);
                            setObdActionError("");
                          }}
                        >
                          🗑️ Supprimer
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </td>
                </tr>
              )),
              obdSearch || obdSeverity
                ? "Aucun code OBD ne correspond à ces filtres."
                : "Aucun code OBD enregistré.",
            )}
            {obdTotalPages > 1 && (
              <Pagination className="admin-users-pagination mb-0" aria-label="Pagination des codes OBD">
                <Pagination.Prev
                  disabled={obdPage <= 1 || obdLoading}
                  onClick={() => {
                    setObdLoading(true);
                    setObdPage((page) => Math.max(1, page - 1));
                  }}
                />
                <Pagination.Item active disabled>
                  {obdPage} / {obdTotalPages}
                </Pagination.Item>
                <Pagination.Next
                  disabled={obdPage >= obdTotalPages || obdLoading}
                  onClick={() => {
                    setObdLoading(true);
                    setObdPage((page) => Math.min(obdTotalPages, page + 1));
                  }}
                />
              </Pagination>
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
    const diagnosisChart = dashboard?.diagnosisChart || [];
    const maxDiagnosisCount = Math.max(
      4,
      Math.ceil(Math.max(...diagnosisChart.map((item) => item.count), 0) / 4) * 4,
    );
    const chart = {
      left: 48,
      right: 620,
      top: 18,
      bottom: 190,
    };
    const chartHeight = chart.bottom - chart.top;
    const chartWidth = chart.right - chart.left;
    const barWidth = Math.min(48, chartWidth / Math.max(diagnosisChart.length, 1) * 0.52);
    const monthLabel = (value) => {
      const [year, month] = value.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("fr-FR", {
        month: "short",
        timeZone: "UTC",
      }).replace(".", "");
    };

    return (
      <>
        <div className="admin-dashboard-section-heading">
          <div>
            <span className="eyebrow mb-1">Vue d&apos;ensemble</span>
            <h2>Indicateurs de performance</h2>
          </div>
          <Badge bg="light" text="dark" className="admin-updated-badge">
            Données actualisées
          </Badge>
        </div>
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

        <Card className="admin-content-card admin-chart-card mb-4">
          <Card.Body>
            <div className="admin-chart-heading">
              <div>
                <span className="eyebrow mb-1">Évolution de l&apos;activité</span>
                <Card.Title as="h2">Diagnostics par mois</Card.Title>
                <Card.Text>Volume des diagnostics effectués au cours des six derniers mois.</Card.Text>
              </div>
              <Badge bg="light" text="dark" className="admin-chart-period">6 derniers mois</Badge>
            </div>
            {diagnosisChart.length ? (
              <div className="admin-chart-scroll">
                <svg
                  className="admin-diagnosis-chart"
                  viewBox="0 0 640 235"
                  role="img"
                  aria-labelledby="diagnosis-chart-title diagnosis-chart-description"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <title id="diagnosis-chart-title">Diagnostics effectués par mois</title>
                  <desc id="diagnosis-chart-description">
                    Histogramme des diagnostics mensuels sur les six derniers mois.
                  </desc>
                  <defs>
                    <linearGradient id="diagnosis-bar-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#2385a0" />
                      <stop offset="100%" stopColor="#176b87" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2, 3, 4].map((tick) => {
                    const y = chart.top + (chartHeight / 4) * tick;
                    const value = Math.round(maxDiagnosisCount * (4 - tick) / 4);
                    return (
                      <g key={tick}>
                        <line
                          x1={chart.left}
                          x2={chart.right}
                          y1={y}
                          y2={y}
                          className="admin-chart-gridline"
                        />
                        <text x={chart.left - 12} y={y + 4} className="admin-chart-axis-label">
                          {value}
                        </text>
                      </g>
                    );
                  })}
                  {diagnosisChart.map((item, index) => {
                    const slotWidth = chartWidth / diagnosisChart.length;
                    const x = chart.left + slotWidth * index + (slotWidth - barWidth) / 2;
                    const barHeight = item.count
                      ? Math.max((item.count / maxDiagnosisCount) * chartHeight, 3)
                      : 0;
                    const y = chart.bottom - barHeight;
                    return (
                      <g key={item.month}>
                        {item.count > 0 && (
                          <>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              rx="7"
                              fill="url(#diagnosis-bar-gradient)"
                            />
                            <text x={x + barWidth / 2} y={y - 8} className="admin-chart-value">
                              {item.count}
                            </text>
                          </>
                        )}
                        <text
                          x={x + barWidth / 2}
                          y={chart.bottom + 25}
                          className="admin-chart-month"
                        >
                          {monthLabel(item.month)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <p className="admin-empty mb-0">Les données mensuelles ne sont pas disponibles.</p>
            )}
          </Card.Body>
        </Card>

        <Row className="g-4 mb-4">
          <Col xl={6}>
            <Card className="admin-content-card admin-dashboard-panel h-100">
              <Card.Body>
                <div className="admin-panel-title">
                  <span className="admin-panel-title-icon">🔧</span>
                  <div>
                    <span className="eyebrow mb-1">Catalogue</span>
                    <Card.Title as="h2" className="mb-0">Codes OBD fréquents</Card.Title>
                  </div>
                </div>
                {(dashboard?.frequentOBDCodes || []).length ? (
                  <ListGroup variant="flush" className="admin-popular-codes">
                    {dashboard.frequentOBDCodes.map((code) => {
                      const maxCount = Math.max(
                        ...dashboard.frequentOBDCodes.map((item) => item.count),
                        1,
                      );
                      return (
                        <ListGroup.Item key={code.code}>
                          <div className="admin-popular-code-label">
                            <Badge bg="light" text="dark">{code.code}</Badge>
                            <span>{code.count} diagnostic{code.count === 1 ? "" : "s"}</span>
                          </div>
                          <div
                            className="admin-popular-code-track"
                            role="img"
                            aria-label={`${code.code} utilisé dans ${code.count} diagnostics`}
                          >
                            <span style={{ width: `${(code.count / maxCount) * 100}%` }} />
                          </div>
                          {code.description && <small>{code.description}</small>}
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                ) : (
                  <p className="admin-empty mb-0">Aucun code OBD utilisé dans les diagnostics.</p>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col xl={6}>
            <Card className="admin-content-card admin-dashboard-panel h-100">
              <Card.Body>
                <div className="admin-panel-title admin-panel-title-action">
                  <div className="admin-panel-title">
                    <span className="admin-panel-title-icon">📋</span>
                    <div>
                      <span className="eyebrow mb-1">Suivi de la plateforme</span>
                      <Card.Title as="h2" className="mb-0">Diagnostics récents</Card.Title>
                    </div>
                  </div>
                  <Button variant="outline-primary" size="sm" onClick={() => selectSection("diagnoses")}>
                    Voir tout
                  </Button>
                </div>
                {(dashboard?.recentDiagnoses || []).length ? (
                  <ListGroup variant="flush" className="admin-recent-diagnoses-list">
                    {dashboard.recentDiagnoses.slice(0, 5).map((diagnosis) => (
                      <ListGroup.Item key={diagnosis._id}>
                        <div className="admin-recent-diagnosis-main">
                          <strong>
                            {diagnosis.vehicle
                              ? `${diagnosis.vehicle.brand} ${diagnosis.vehicle.model}`
                              : "Véhicule supprimé"}
                          </strong>
                          <span>{diagnosis.obdCodes?.join(", ") || "Sans code OBD"}</span>
                        </div>
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
          </Col>
        </Row>

        <Row className="g-4 mb-4">
          <Col md={6}>
            <Card className="admin-content-card admin-dashboard-panel h-100">
              <Card.Body>
                <div className="admin-panel-title">
                  <span className="admin-panel-title-icon admin-alert-icon">⚠️</span>
                  <div>
                    <span className="eyebrow mb-1">À surveiller · 7 jours</span>
                    <Card.Title as="h2" className="mb-0">Alertes</Card.Title>
                  </div>
                  <Badge
                    bg={stats?.activeAlerts ? "warning" : "success"}
                    text={stats?.activeAlerts ? "dark" : "white"}
                    className="ms-auto"
                  >
                    {stats?.activeAlerts ?? 0}
                  </Badge>
                </div>
                {(dashboard?.recentAlerts || []).length ? (
                  <ListGroup variant="flush" className="admin-alert-list">
                    {dashboard.recentAlerts.slice(0, 3).map((alert) => (
                      <ListGroup.Item key={alert._id}>
                        <span className={`admin-alert-severity ${alert.severity}`}>
                          {alert.severity === "critical" ? "Critique" : "Élevée"}
                        </span>
                        <strong>{alert.obdCodes?.join(", ") || "Diagnostic à vérifier"}</strong>
                        <span>
                          {alert.vehicle
                            ? `${alert.vehicle.brand} ${alert.vehicle.model}`
                            : "Véhicule supprimé"}
                        </span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="admin-empty mb-0">Aucune alerte élevée ou critique cette semaine.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="admin-content-card admin-dashboard-panel h-100">
              <Card.Body>
                <div className="admin-panel-title">
                  <span className="admin-panel-title-icon">🕐</span>
                  <div>
                    <span className="eyebrow mb-1">Dernières inscriptions</span>
                    <Card.Title as="h2" className="mb-0">Activité</Card.Title>
                  </div>
                </div>
                {(dashboard?.recentUsers || []).length ? (
                  <ListGroup variant="flush" className="admin-activity-list">
                    {dashboard.recentUsers.slice(0, 4).map((user) => (
                      <ListGroup.Item key={user._id}>
                        <span className="admin-activity-avatar">
                          {(user.name || user.email || "?").charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <strong>{user.name}</strong>
                          <small>{roleLabels[user.role] || user.role}</small>
                        </div>
                        <time dateTime={user.createdAt}>
                          {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                        </time>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <p className="admin-empty mb-0">Aucune activité utilisateur récente.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="admin-dashboard-section-heading admin-secondary-heading">
          <div>
            <span className="eyebrow mb-1">Catalogue &amp; croissance</span>
            <h2>Autres indicateurs</h2>
          </div>
        </div>
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
          <span className="admin-navbar-page-title">
            {activeSection === "dashboard" ? "Dashboard Admin" : activeLabel}
          </span>
          <div className="admin-navbar-account">
            <Button
              type="button"
              variant="link"
              className="admin-notification-button"
              onClick={() => selectSection("diagnoses")}
              aria-label={`${stats?.activeAlerts ?? 0} alertes, ouvrir les diagnostics`}
            >
              🔔
              {stats?.activeAlerts > 0 && (
                <Badge bg="danger" pill>{stats.activeAlerts}</Badge>
              )}
            </Button>
            <span>{admin?.name || "Admin"} <span aria-hidden="true">👤</span></span>
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
              {activeSection !== "dashboard" && (
                <Card className="admin-welcome-hero border-0 mb-4">
                  <Card.Body>
                    <span className="eyebrow">
                      <span className="eyebrow-dot" aria-hidden="true" />
                      Espace administrateur
                    </span>
                    <h1>{activeLabel}</h1>
                    <p>
                      Consultez et gérez les {activeLabel?.toLowerCase()} de votre plateforme.
                    </p>
                  </Card.Body>
                </Card>
              )}

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

      <Modal
        show={["profile", "vehicles", "diagnoses"].includes(userModal)}
        onHide={() => !userActionLoading && setUserModal("")}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {userModal === "vehicles"
              ? "Véhicules de l'utilisateur"
              : userModal === "diagnoses"
                ? "Diagnostics de l'utilisateur"
                : "Profil utilisateur"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userActionError && <Alert variant="danger">{userActionError}</Alert>}
          {userActionLoading || !userDetails ? (
            <div className="admin-loading" role="status">
              <Spinner animation="border" size="sm" className="me-2" />
              Chargement des informations...
            </div>
          ) : userModal === "profile" ? (
            <>
              <div className="admin-user-profile">
                <span className="admin-user-profile-avatar">
                  {(userDetails.user.name || "?").charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3>{userDetails.user.name}</h3>
                  <p>{userDetails.user.email}</p>
                </div>
                <Badge bg={userDetails.user.isActive ? "success" : "secondary"}>
                  {userDetails.user.isActive ? "Actif" : "Désactivé"}
                </Badge>
              </div>
              <Row className="g-3 mt-2">
                <Col sm={4}>
                  <Card className="admin-profile-stat"><Card.Body>
                    <span>Compte créé</span>
                    <strong>{new Date(userDetails.user.createdAt).toLocaleDateString("fr-FR")}</strong>
                  </Card.Body></Card>
                </Col>
                <Col sm={4}>
                  <Card className="admin-profile-stat"><Card.Body>
                    <span>Véhicules</span>
                    <strong>{userDetails.vehicles.length}</strong>
                  </Card.Body></Card>
                </Col>
                <Col sm={4}>
                  <Card className="admin-profile-stat"><Card.Body>
                    <span>Diagnostics</span>
                    <strong>{userDetails.diagnoses.length}</strong>
                  </Card.Body></Card>
                </Col>
              </Row>
            </>
          ) : userModal === "vehicles" ? (
            userDetails.vehicles.length ? (
              <Table responsive hover className="admin-data-table mb-0">
                <thead><tr><th>Véhicule</th><th>Année</th><th>Motorisation</th></tr></thead>
                <tbody>
                  {userDetails.vehicles.map((vehicle) => (
                    <tr key={vehicle._id}>
                      <td>{vehicle.brand} {vehicle.model}</td>
                      <td>{vehicle.year}</td>
                      <td>{vehicle.engine || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <p className="admin-empty mb-0">Aucun véhicule enregistré pour ce compte.</p>
          ) : (
            userDetails.diagnoses.length ? (
              <Table responsive hover className="admin-data-table mb-0">
                <thead><tr><th>Date</th><th>Véhicule</th><th>Codes OBD</th><th>Gravité</th></tr></thead>
                <tbody>
                  {userDetails.diagnoses.map((diagnosis) => (
                    <tr key={diagnosis._id}>
                      <td>{new Date(diagnosis.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td>
                        {diagnosis.vehicle
                          ? `${diagnosis.vehicle.brand} ${diagnosis.vehicle.model}`
                          : "Véhicule supprimé"}
                      </td>
                      <td>{diagnosis.obdCodes?.join(", ") || "—"}</td>
                      <td className="text-capitalize">{diagnosis.severity}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : <p className="admin-empty mb-0">Aucun diagnostic enregistré pour ce compte.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setUserModal("")}>Fermer</Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={userModal === "edit"}
        onHide={() => !userActionLoading && setUserModal("")}
        centered
      >
        <Form onSubmit={handleEditUser}>
          <Modal.Header closeButton>
            <Modal.Title>Modifier le compte utilisateur</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {userActionError && <Alert variant="danger">{userActionError}</Alert>}
            <Form.Group className="mb-3" controlId="edit-user-name">
              <Form.Label>Nom</Form.Label>
              <Form.Control
                value={editUser.name}
                onChange={(event) => setEditUser({ ...editUser, name: event.target.value })}
                autoComplete="name"
                required
              />
            </Form.Group>
            <Form.Group controlId="edit-user-email">
              <Form.Label>Adresse email</Form.Label>
              <Form.Control
                type="email"
                value={editUser.email}
                onChange={(event) => setEditUser({ ...editUser, email: event.target.value })}
                autoComplete="email"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setUserModal("")} disabled={userActionLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={userActionLoading}>
              {userActionLoading && <Spinner animation="border" size="sm" className="me-2" />}
              Enregistrer
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={["deactivate", "reactivate", "delete"].includes(userModal)}
        onHide={() => !userActionLoading && setUserModal("")}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {userModal === "delete"
              ? "Supprimer définitivement le compte ?"
              : userModal === "deactivate"
                ? "Désactiver ce compte ?"
                : "Réactiver ce compte ?"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userActionError && <Alert variant="danger">{userActionError}</Alert>}
          {userModal === "delete" ? (
            <p>
              Le compte de <strong>{selectedUser?.name}</strong>, ses véhicules et ses diagnostics seront
              supprimés définitivement. Cette action est irréversible.
            </p>
          ) : userModal === "deactivate" ? (
            <p>
              <strong>{selectedUser?.name}</strong> ne pourra plus se connecter. Ses véhicules et ses
              diagnostics seront conservés.
            </p>
          ) : (
            <p>Le compte de <strong>{selectedUser?.name}</strong> pourra à nouveau se connecter.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setUserModal("")} disabled={userActionLoading}>
            Annuler
          </Button>
          <Button
            variant={userModal === "delete" ? "danger" : "primary"}
            onClick={handleUserAction}
            disabled={userActionLoading}
          >
            {userActionLoading && <Spinner animation="border" size="sm" className="me-2" />}
            {userModal === "delete" ? "Supprimer" : userModal === "deactivate" ? "Désactiver" : "Réactiver"}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={Boolean(deletingObd)}
        onHide={() => !obdActionLoading && setDeletingObd(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Supprimer ce code OBD ?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {obdActionError && <Alert variant="danger">{obdActionError}</Alert>}
          <p>
            Le code <strong>{deletingObd?.code}</strong> sera supprimé du catalogue. Cette action est
            irréversible ; les diagnostics déjà enregistrés seront conservés.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setDeletingObd(null)}
            disabled={obdActionLoading}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDeleteObd} disabled={obdActionLoading}>
            {obdActionLoading && <Spinner animation="border" size="sm" className="me-2" />}
            Supprimer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default AdminDashboard;
