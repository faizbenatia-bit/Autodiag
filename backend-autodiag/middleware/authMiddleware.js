const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        let token;

        // Récupération du token depuis l'en-tête HTTP
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            token = req.headers.authorization.split(" ")[1];
        }

        // Vérification du token
        if (!token) {
            return res.status(401).json({
                message: "Authentification requise"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Recherche de l'utilisateur
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "Utilisateur introuvable"
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                message: "Ce compte a été désactivé. Contactez l'administrateur."
            });
        }

        // Mise à disposition de l'utilisateur pour la suite
        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token invalide ou expiré"
        });
    }
};

module.exports = { protect };