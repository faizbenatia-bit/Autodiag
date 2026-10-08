const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// Inscription
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Vérifier les champs obligatoires
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Tous les champs sont obligatoires"
            });
        }

        // Vérifier la longueur du mot de passe
        if (password.length < 8) {
            return res.status(400).json({
                message: "Le mot de passe doit contenir 8 caractères minimum"
            });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Cet email existe déjà"
            });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 12);

        // Créer l'utilisateur
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        // Générer le token
        const token = generateToken(user._id);

        // Réponse
        return res.status(201).json({
            message: "Compte créé avec succès",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de l'inscription"
        });
    }
};

// Connexion
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email et mot de passe obligatoires"
            });
        }

        // Recherche de l'utilisateur
        const user = await User.findOne({
            email: email.toLowerCase()
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Identifiants invalides"
            });
        }

        // Comparer le mot de passe
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Identifiants invalides"
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                message: "Ce compte a été désactivé. Contactez l'administrateur."
            });
        }

        // Générer le token
        const token = generateToken(user._id);

        return res.status(200).json({
            message: "Connexion réussie",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la connexion"
        });
    }
};