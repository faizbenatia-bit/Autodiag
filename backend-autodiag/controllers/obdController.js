const OBDCode = require("../models/OBDCode");

// Rechercher un code OBD
exports.getOBDCode = async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();

        const obd = await OBDCode.findOne({
            code
        });

        if (!obd) {
            return res.status(404).json({
                message: "Code OBD inconnu dans notre catalogue"
            });
        }

        return res.status(200).json({
            obd
        });

    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la recherche"
        });
    }
};

// Lister les codes OBD
exports.getAllOBDCodes = async (req, res) => {
    try {
        const codes = await OBDCode.find().sort({
            code: 1
        });

        return res.status(200).json({
            count: codes.length,
            codes
        });

    } catch (error) {
        return res.status(500).json({
            message: "Erreur de récupération"
        });
    }
};

// Ajouter un code OBD
exports.createOBDCode = async (req, res) => {
    try {
        const {
            code,
            description,
            system,
            severity,
            possibleCauses,
            recommendedChecks
        } = req.body;

        if (
            typeof code !== "string" ||
            !code.trim() ||
            typeof description !== "string" ||
            !description.trim() ||
            typeof system !== "string" ||
            !system.trim() ||
            (severity !== undefined &&
                !["low", "medium", "high", "critical"].includes(severity)) ||
            (possibleCauses !== undefined &&
                (!Array.isArray(possibleCauses) ||
                    !possibleCauses.every((item) => typeof item === "string"))) ||
            (recommendedChecks !== undefined &&
                (!Array.isArray(recommendedChecks) ||
                    !recommendedChecks.every((item) => typeof item === "string")))
        ) {
            return res.status(400).json({
                message: "Les informations du code OBD sont invalides"
            });
        }

        const obd = await OBDCode.create({
            code: code.trim().toUpperCase(),
            description: description.trim(),
            system: system.trim(),
            severity,
            possibleCauses: possibleCauses || [],
            recommendedChecks: recommendedChecks || []
        });

        return res.status(201).json({
            message: "Code OBD ajouté",
            obd
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Ce code OBD existe déjà"
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        return res.status(500).json({
            message: "Erreur lors de la création du code OBD"
        });
    }
};