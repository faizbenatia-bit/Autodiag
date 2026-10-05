const Vehicle = require("../models/Vehicle");

const belongsToUser = (userId) => ({
    $or: [{ user: userId }, { owner: userId }]
});

// Ajouter un véhicule
exports.createVehicle = async (req, res) => {
    try {
        const {
            brand,
            model,
            year,
            engine
        } = req.body;

        // Vérification des champs obligatoires
        if (
            typeof brand !== "string" ||
            !brand.trim() ||
            typeof model !== "string" ||
            !model.trim() ||
            !Number.isFinite(Number(year)) ||
            Number(year) < 1900
        ) {
            return res.status(400).json({
                message: "Champs obligatoires manquants"
            });
        }

        // Création du véhicule
        const vehicle = await Vehicle.create({
            user: req.user._id,
            brand: brand.trim(),
            model: model.trim(),
            year: Number(year),
            engine: typeof engine === "string" ? engine.trim() : ""
        });

        return res.status(201).json({
            message: "Véhicule créé",
            vehicle
        });

    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la création"
        });
    }
};

// Afficher les véhicules de l'utilisateur
exports.getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            ...belongsToUser(req.user._id)
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            count: vehicles.length,
            vehicles
        });

    } catch (error) {
        return res.status(500).json({
            message: "Erreur de récupération"
        });
    }
};

// Afficher un véhicule
exports.getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            ...belongsToUser(req.user._id)
        });

        if (!vehicle) {
            return res.status(404).json({
                message: "Véhicule introuvable"
            });
        }

        return res.status(200).json(vehicle);

    } catch (error) {
        return res.status(400).json({
            message: "Identifiant invalide ou erreur de lecture"
        });
    }
};

// Modifier un véhicule
exports.updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndUpdate(
            {
                _id: req.params.id,
                ...belongsToUser(req.user._id)
            },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!vehicle) {
            return res.status(404).json({
                message: "Véhicule introuvable"
            });
        }

        return res.status(200).json({
            message: "Véhicule modifié",
            vehicle
        });

    } catch (error) {
        return res.status(400).json({
            message: "Erreur de modification"
        });
    }
};

// Supprimer un véhicule
exports.deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndDelete({
            _id: req.params.id,
            ...belongsToUser(req.user._id)
        });

        if (!vehicle) {
            return res.status(404).json({
                message: "Véhicule introuvable"
            });
        }

        return res.status(200).json({
            message: "Véhicule supprimé"
        });

    } catch (error) {
        return res.status(400).json({
            message: "Erreur de suppression"
        });
    }
};