const express = require("express");

const {
    register,
    login
} = require("../controllers/authController");

const router = express.Router();

// Inscription
router.post("/register", register);

// Connexion
router.post("/login", login);

module.exports = router;