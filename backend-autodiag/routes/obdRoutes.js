const express = require("express");

const {
    getOBDCode,
    getAllOBDCodes,
    createOBDCode
} = require("../controllers/obdController");

const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

// Consultation des codes
router.get("/", protect, getAllOBDCodes);
router.get("/:code", protect, getOBDCode);

// Ajout réservé aux administrateurs
router.post("/", protect, adminOnly, createOBDCode);

module.exports = router;