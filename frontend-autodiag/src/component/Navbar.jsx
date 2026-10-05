import { Button, Container, Nav, Navbar as BootstrapNavbar } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", {
      replace: true,
      state: { notification: "Utilisateur déconnecté." },
    });
  };

  const isActive = (path) =>
    pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));

  return (
    <BootstrapNavbar className="app-navbar" expand="lg" variant="dark">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" aria-label="AutoDiag, accueil">
          <span className="brand-mark" aria-hidden="true">AD</span>
          <span className="brand-copy">
            AutoDiag
            <small>Votre copilote auto</small>
          </span>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="autodiag-navigation" />
        <BootstrapNavbar.Collapse id="autodiag-navigation">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" active={isActive("/")}>
              Accueil
            </Nav.Link>
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/vehicles" active={isActive("/vehicles")}>
                  Mes véhicules
                </Nav.Link>
                <Nav.Link as={Link} to="/history" active={isActive("/history")}>
                  Historique
                </Nav.Link>
              </>
            )}
            {isAuthenticated ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/diagnosis"
                  active={isActive("/diagnosis")}
                  className="nav-cta"
                >
                  Nouveau diagnostic
                </Nav.Link>
                <Button
                  type="button"
                  variant="link"
                  className="nav-link"
                  onClick={handleLogout}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" active={isActive("/login")}>
                  Connexion
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/register"
                  active={isActive("/register")}
                  className="nav-cta"
                >
                  Créer un compte
                </Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;
