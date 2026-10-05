const express = require("express");

const {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
} = require("../controllers/vehicleController.js");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(protect);

router.route("/")
    .post(createVehicle)
    .get(getVehicles);

router.route("/:id")
    .get(getVehicleById)
    .put(updateVehicle)
    .delete(deleteVehicle);

module.exports = router;