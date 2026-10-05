// Importation de Mongoose
const mongoose = require("mongoose");

// Fonction de connexion à MongoDB
const connectDB = async () => {
    try {
        // Connexion à la base de données
        const conn = await mongoose.connect(process.env.MONGO_URI);

        // Affichage du nom de l'hôte connecté
        console.log(`MongoDB connecté : ${conn.connection.host}`);
    } catch (error) {
        console.error("Erreur MongoDB :", error.message);

        // Arrêt du processus en cas d'échec
        process.exit(1);
    }
};

module.exports = connectDB;