// Importer Mongoose
const mongoose = require("mongoose");

// Définir le schéma d'un véhicule
const vehicleSchema = new mongoose.Schema(
  {
    // Marque du véhicule
    brand: {
      type: String,
      required: true,
      trim: true,
    },

    // Modèle du véhicule
    model: {
      type: String,
      required: true,
      trim: true,
    },

    // Année de fabrication
    year: {
      type: Number,
      required: true,
      min: 1900,
    },

    // Motorisation
    engine: {
      type: String,
      trim: true,
    },

    // Propriétaire du véhicule
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Créer le modèle Vehicle
module.exports = mongoose.model("Vehicle", vehicleSchema);