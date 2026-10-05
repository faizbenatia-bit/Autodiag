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
        const obd = await OBDCode.create(req.body);

        return res.status(201).json({
            message: "Code OBD ajouté",
            obd
        });

    } catch (error) {
        return res.status(400).json({
            message: "Impossible de créer le code OBD"
        });
    }
};