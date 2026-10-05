const mongoose = require("mongoose");

// Définition du schéma utilisateur
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Le nom est obligatoire"],
            trim: true
        },

        email: {
            type: String,
            required: [true, "L'email est obligatoire"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, "Le mot de passe est obligatoire"],
            minlength: 8,
            select: false
        },

        role: {
            type: String,
            enum: ["user", "admin", "mechanic"],
            default: "user"
        }
    },
    {
        timestamps: true
    }
);

// Création du modèle
module.exports = mongoose.model("User", userSchema);