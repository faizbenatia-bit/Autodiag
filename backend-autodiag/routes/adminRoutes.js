const express = require("express");
const {
    deleteUser,
    deleteOBDCode,
    getDashboardStats,
    getOBDCodes,
    getVehicles,
    getUserDetails,
    getUsers,
    setUserActiveStatus,
    updateOBDCode,
    updateUser
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/stats", protect, adminOnly, getDashboardStats);
router.get("/users", protect, adminOnly, getUsers);
router.get("/obd", protect, adminOnly, getOBDCodes);
router.patch("/obd/:id", protect, adminOnly, updateOBDCode);
router.delete("/obd/:id", protect, adminOnly, deleteOBDCode);
router.get("/vehicles", protect, adminOnly, getVehicles);
router.get("/users/:id", protect, adminOnly, getUserDetails);
router.patch("/users/:id", protect, adminOnly, updateUser);
router.patch("/users/:id/status", protect, adminOnly, setUserActiveStatus);
router.delete("/users/:id", protect, adminOnly, deleteUser);

module.exports = router;
