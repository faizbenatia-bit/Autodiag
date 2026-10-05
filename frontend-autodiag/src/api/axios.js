// Importer Axios
import axios from "axios";

// Créer une instance Axios
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur exécuté avant chaque requête
api.interceptors.request.use(
  (config) => {
    // Récupérer le token stocké
    const token = localStorage.getItem("token");

    // Ajouter le token si disponible
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Continuer la requête
    return config;
  },
  (error) => {
    // Transmettre les erreurs de configuration
    return Promise.reject(error);
  }
);

// Exporter l'instance
export default api;