const jwt = require("jsonwebtoken");

// Générer un token JWT
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

module.exports = generateToken;