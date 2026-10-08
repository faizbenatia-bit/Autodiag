const Vehicle = require("../models/Vehicle");
const Diagnosis = require("../models/Diagnosis");
const { analyzeVehicle } = require("../services/diagnosisService");

// Effectuer un diagnostic
exports.createDiagnosis = async (req, res) => {
  try {
    const {
      vehicleId = req.body.vehicle,
      obdCodes,
    } = req.body;

    // Vérifier les données obligatoires
    if (
      !vehicleId ||
      !Array.isArray(obdCodes) ||
      !obdCodes.every((code) => typeof code === "string")
    ) {
      return res.status(400).json({
        message: "Données du diagnostic invalides",
      });
    }

    if (obdCodes.length === 0) {
      return res.status(400).json({
        message: "Saisissez au moins un code OBD",
      });
    }

    // Vérifier la propriété du véhicule
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      $or: [{ user: req.user._id }, { owner: req.user._id }],
    });

    if (!vehicle) {
      return res.status(404).json({
        message: "Véhicule introuvable",
      });
    }

    // Analyser les informations
    const result = await analyzeVehicle({ obdCodes });

    // Enregistrer le diagnostic
    const diagnosis = await Diagnosis.create({
      user: req.user._id,
      vehicle: vehicle._id,

      obdCodes: result.matchedCodes,

      findings: result.findings,

      possibleCauses: result.possibleCauses,
      recommendations: result.recommendations,

      severity: result.severity,
    });

    return res.status(201).json({
      message: "Pré-diagnostic terminé",
      diagnosis,

      warnings: {
        unknownCodes: result.unknownCodes,
      },
      codeDetails: result.codeDetails,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors du diagnostic",
    });
  }
};

// Historique des diagnostics de l'utilisateur
exports.getDiagnoses = async (req, res) => {
  try {
    const diagnoses = await Diagnosis.find({
      user: req.user._id,
    })
      .populate("vehicle", "brand model year")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: diagnoses.length,
      diagnoses,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur de récupération",
    });
  }
};

// Détail d'un diagnostic
exports.getDiagnosisById = async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("vehicle");

    if (!diagnosis) {
      return res.status(404).json({
        message: "Diagnostic introuvable",
      });
    }

    return res.status(200).json(diagnosis);
  } catch (error) {
    return res.status(400).json({
      message: "Identifiant invalide ou erreur de lecture",
    });
  }
};

// Supprimer un diagnostic de l'utilisateur
exports.deleteDiagnosis = async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!diagnosis) {
      return res.status(404).json({
        message: "Diagnostic introuvable",
      });
    }

    return res.status(200).json({
      message: "Diagnostic supprimé",
    });
  } catch (error) {
    return res.status(400).json({
      message: "Identifiant invalide ou erreur de suppression",
    });
  }
};

// Effacer l'historique de l'utilisateur
exports.deleteDiagnoses = async (req, res) => {
  try {
    const result = await Diagnosis.deleteMany({
      user: req.user._id,
    });

    return res.status(200).json({
      message: "Historique supprimé",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erreur lors de la suppression de l'historique",
    });
  }
};

module.exports = {
  createDiagnosis: exports.createDiagnosis,
  getDiagnoses: exports.getDiagnoses,
  getDiagnosisById: exports.getDiagnosisById,
  deleteDiagnosis: exports.deleteDiagnosis,
  deleteDiagnoses: exports.deleteDiagnoses,
};
