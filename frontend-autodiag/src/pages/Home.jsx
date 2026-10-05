import { Button, Card, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

const features = [
  {
    icon: "01",
    title: "Vos véhicules",
    description:
      "Gardez les informations de vos voitures au même endroit et retrouvez-les pour chaque analyse.",
  },
  {
    icon: "02",
    title: "Codes OBD-II",
    description:
      "Ajoutez les codes relevés par votre lecteur pour mieux comprendre les alertes du tableau de bord.",
  },
  {
    icon: "03",
    title: "Pré-diagnostic clair",
    description:
      "Croisez symptômes et codes pour obtenir des pistes et des recommandations faciles à consulter.",
  },
];

function Home() {
  return (
    <main className="home">
      <section className="home-hero">
        <div className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          L'entretien auto, plus clair
        </div>
        <h1>Comprenez votre voiture. Prenez la route sereinement.</h1>
        <p>
          Décrivez les symptômes, ajoutez vos codes OBD-II et obtenez des pistes
          de diagnostic pour savoir quoi vérifier ensuite.
        </p>
        <div className="hero-actions">
          <Button as={Link} to="/diagnosis" variant="primary">
            Lancer un diagnostic
          </Button>
          <Button as={Link} to="/vehicles" variant="outline-light">
            Gérer mes véhicules
          </Button>
        </div>
      </section>

      <section aria-labelledby="features-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow mb-2">Simple, de bout en bout</span>
            <h2 id="features-title">Tout ce qu’il faut pour y voir plus clair</h2>
          </div>
          <p>Du premier voyant aux prochaines étapes.</p>
        </div>
        <Row className="g-3 g-lg-4">
          {features.map((feature) => (
            <Col key={feature.title} md={4}>
              <Card className="feature-card border-0">
                <div className="feature-icon" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </main>
  );
}

export default Home;
