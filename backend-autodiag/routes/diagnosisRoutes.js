const express = require("express");

const {
    createDiagnosis,
    getDiagnoses,
    getDiagnosisById,
    deleteDiagnosis,
    deleteDiagnoses
} = require("../controllers/diagnosisController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

// Créer un pré-diagnostic
router.post("/", createDiagnosis);

// Historique
router.get("/", getDiagnoses);
router.delete("/", deleteDiagnoses);

// Détail d'un diagnostic
router.route("/:id")
    .get(getDiagnosisById)
    .delete(deleteDiagnosis);

module.exports = router;