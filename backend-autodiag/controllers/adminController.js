const Diagnosis = require("../models/Diagnosis");
const DiagnosisRule = require("../models/DiagnosisRule");
const mongoose = require("mongoose");
const OBDCode = require("../models/OBDCode");
const Symptom = require("../models/Symptom");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");

const getManagedUser = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return { error: "invalid" };
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
        return { error: "notFound" };
    }
    if (user.role === "admin") {
        return { error: "forbidden" };
    }

    return { user };
};

exports.getUsers = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
        const filter = { role: { $ne: "admin" } };
        const [users, totalUsers] = await Promise.all([
            User.find(filter)
                .select("name email role isActive createdAt")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);

        const userIds = users.map(({ _id }) => _id);
        const [vehicleCounts, diagnosisCounts] = await Promise.all([
            Vehicle.aggregate([
                { $match: { $or: [{ user: { $in: userIds } }, { owner: { $in: userIds } }] } },
                {
                    $project: {
                        owners: {
                            $setUnion: [
                                { $cond: [{ $ne: ["$user", null] }, ["$user"], []] },
                                { $cond: [{ $ne: ["$owner", null] }, ["$owner"], []] }
                            ]
                        }
                    }
                },
                { $unwind: "$owners" },
                { $match: { owners: { $in: userIds } } },
                { $group: { _id: "$owners", count: { $sum: 1 } } }
            ]),
            Diagnosis.aggregate([
                { $match: { user: { $in: userIds } } },
                { $group: { _id: "$user", count: { $sum: 1 } } }
            ])
        ]);
        const vehicleCountByUser = new Map(vehicleCounts.map(({ _id, count }) => [_id.toString(), count]));
        const diagnosisCountByUser = new Map(diagnosisCounts.map(({ _id, count }) => [_id.toString(), count]));

        return res.status(200).json({
            users: users.map((user) => ({
                ...user,
                isActive: user.isActive !== false,
                vehicleCount: vehicleCountByUser.get(user._id.toString()) || 0,
                diagnosisCount: diagnosisCountByUser.get(user._id.toString()) || 0
            })),
            page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors du chargement des utilisateurs"
        });
    }
};

exports.getVehicles = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
        const search = typeof req.query.search === "string"
            ? req.query.search.trim().slice(0, 100)
            : "";
        const filter = {};

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchPattern = new RegExp(escapedSearch, "i");
            const matchingOwners = await User.find({
                $or: [{ name: searchPattern }, { email: searchPattern }]
            }).distinct("_id");
            const searchConditions = [
                { brand: searchPattern },
                { model: searchPattern },
                { engine: searchPattern }
            ];
            const year = Number(search);

            if (Number.isInteger(year)) {
                searchConditions.push({ year });
            }
            if (matchingOwners.length) {
                searchConditions.push(
                    { user: { $in: matchingOwners } },
                    { owner: { $in: matchingOwners } }
                );
            }
            filter.$or = searchConditions;
        }

        const [vehicles, totalVehicles] = await Promise.all([
            Vehicle.find(filter)
                .select("brand model year engine user owner createdAt")
                .populate("user", "name email")
                .populate("owner", "name email")
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Vehicle.countDocuments(filter)
        ]);

        return res.status(200).json({
            vehicles,
            page,
            totalPages: Math.ceil(totalVehicles / limit),
            totalVehicles
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors du chargement des véhicules"
        });
    }
};

exports.getOBDCodes = async (req, res) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
        const search = typeof req.query.search === "string"
            ? req.query.search.trim().slice(0, 100)
            : "";
        const allowedSeverities = ["low", "medium", "high", "critical"];
        const severity = typeof req.query.severity === "string" ? req.query.severity : "";

        if (severity && !allowedSeverities.includes(severity)) {
            return res.status(400).json({ message: "Le niveau de gravité est invalide" });
        }

        const filter = {};
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const searchPattern = new RegExp(escapedSearch, "i");
            filter.$or = [
                { code: searchPattern },
                { description: searchPattern },
                { system: searchPattern }
            ];
        }
        if (severity) filter.severity = severity;

        const [codes, totalCodes] = await Promise.all([
            OBDCode.find(filter)
                .select("code summary description system severity possibleCauses recommendedChecks createdAt")
                .sort({ code: 1, _id: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            OBDCode.countDocuments(filter)
        ]);

        return res.status(200).json({
            codes,
            page,
            totalPages: Math.ceil(totalCodes / limit),
            totalCodes
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors du chargement des codes OBD"
        });
    }
};

exports.updateOBDCode = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Identifiant de code OBD invalide" });
        }

        const { summary, description, system, severity, possibleCauses, recommendedChecks } = req.body || {};
        if (
            (summary !== undefined &&
                (typeof summary !== "string" || !summary.trim())) ||
            typeof description !== "string" ||
            !description.trim() ||
            typeof system !== "string" ||
            !system.trim() ||
            !["low", "medium", "high", "critical"].includes(severity) ||
            !Array.isArray(possibleCauses) ||
            !possibleCauses.every((item) => typeof item === "string") ||
            !Array.isArray(recommendedChecks) ||
            !recommendedChecks.every((item) => typeof item === "string")
        ) {
            return res.status(400).json({
                message: "Les informations du code OBD sont invalides"
            });
        }

        const obd = await OBDCode.findById(req.params.id);
        if (!obd) {
            return res.status(404).json({ message: "Code OBD introuvable" });
        }

        obd.summary = typeof summary === "string"
            ? summary.trim()
            : obd.summary || description.trim();
        obd.description = description.trim();
        obd.system = system.trim();
        obd.severity = severity;
        obd.possibleCauses = possibleCauses.map((item) => item.trim()).filter(Boolean);
        obd.recommendedChecks = recommendedChecks.map((item) => item.trim()).filter(Boolean);
        await obd.save();

        return res.status(200).json({
            message: "Code OBD modifié",
            obd
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({
            message: "Erreur lors de la modification du code OBD"
        });
    }
};

exports.deleteOBDCode = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Identifiant de code OBD invalide" });
        }

        const obd = await OBDCode.findByIdAndDelete(req.params.id);
        if (!obd) {
            return res.status(404).json({ message: "Code OBD introuvable" });
        }

        return res.status(200).json({ message: "Code OBD supprimé" });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la suppression du code OBD"
        });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const result = await getManagedUser(req.params.id);
        if (result.error) {
            const status = result.error === "forbidden" ? 403 : result.error === "notFound" ? 404 : 400;
            return res.status(status).json({
                message: result.error === "forbidden"
                    ? "Les comptes administrateur ne peuvent pas être gérés ici"
                    : result.error === "notFound"
                        ? "Utilisateur introuvable"
                        : "Identifiant utilisateur invalide"
            });
        }

        const [vehicles, diagnoses] = await Promise.all([
            Vehicle.find({
                $or: [{ user: result.user._id }, { owner: result.user._id }]
            }).sort({ createdAt: -1 }).lean(),
            Diagnosis.find({ user: result.user._id })
                .populate("vehicle", "brand model year")
                .sort({ createdAt: -1 })
                .lean()
        ]);

        return res.status(200).json({
            user: result.user,
            vehicles,
            diagnoses
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors du chargement du profil utilisateur"
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const result = await getManagedUser(req.params.id);
        if (result.error) {
            const status = result.error === "forbidden" ? 403 : result.error === "notFound" ? 404 : 400;
            return res.status(status).json({
                message: result.error === "forbidden"
                    ? "Les comptes administrateur ne peuvent pas être modifiés ici"
                    : result.error === "notFound"
                        ? "Utilisateur introuvable"
                        : "Identifiant utilisateur invalide"
            });
        }

        const { name, email } = req.body;
        if (typeof name !== "string" || !name.trim() ||
            typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                message: "Le nom et l'email sont obligatoires"
            });
        }

        result.user.name = name.trim();
        result.user.email = email.trim().toLowerCase();
        await result.user.save();

        return res.status(200).json({
            message: "Compte utilisateur modifié",
            user: {
                id: result.user._id,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role,
                isActive: result.user.isActive
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Cette adresse email est déjà utilisée"
            });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        return res.status(500).json({
            message: "Erreur lors de la modification du compte utilisateur"
        });
    }
};

exports.setUserActiveStatus = async (req, res) => {
    try {
        if (typeof req.body.isActive !== "boolean") {
            return res.status(400).json({
                message: "L'état du compte doit être actif ou inactif"
            });
        }

        const result = await getManagedUser(req.params.id);
        if (result.error) {
            const status = result.error === "forbidden" ? 403 : result.error === "notFound" ? 404 : 400;
            return res.status(status).json({
                message: result.error === "forbidden"
                    ? "Les comptes administrateur ne peuvent pas être désactivés"
                    : result.error === "notFound"
                        ? "Utilisateur introuvable"
                        : "Identifiant utilisateur invalide"
            });
        }

        result.user.isActive = req.body.isActive;
        await result.user.save();

        return res.status(200).json({
            message: req.body.isActive ? "Compte réactivé" : "Compte désactivé",
            isActive: result.user.isActive
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors du changement d'état du compte"
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const result = await getManagedUser(req.params.id);
        if (result.error) {
            const status = result.error === "forbidden" ? 403 : result.error === "notFound" ? 404 : 400;
            return res.status(status).json({
                message: result.error === "forbidden"
                    ? "Les comptes administrateur ne peuvent pas être supprimés ici"
                    : result.error === "notFound"
                        ? "Utilisateur introuvable"
                        : "Identifiant utilisateur invalide"
            });
        }

        await Promise.all([
            Diagnosis.deleteMany({ user: result.user._id }),
            Vehicle.deleteMany({
                $or: [{ user: result.user._id }, { owner: result.user._id }]
            })
        ]);
        await User.deleteOne({ _id: result.user._id });

        return res.status(200).json({
            message: "Compte et données associées supprimés"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors de la suppression du compte utilisateur"
        });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const chartStart = new Date();
        chartStart.setUTCDate(1);
        chartStart.setUTCHours(0, 0, 0, 0);
        chartStart.setUTCMonth(chartStart.getUTCMonth() - 5);
        const chartEnd = new Date(
            Date.UTC(chartStart.getUTCFullYear(), chartStart.getUTCMonth() + 6, 1)
        );
        const chartMonths = Array.from({ length: 6 }, (_, index) => {
            const month = new Date(chartStart);
            month.setUTCMonth(chartStart.getUTCMonth() + index);
            return month.toISOString().slice(0, 7);
        });
        const alertStart = new Date();
        alertStart.setDate(alertStart.getDate() - 7);

        const [
            totalUsers,
            newUsersThisMonth,
            usersByRole,
            recentUsers,
            recentOBDCodes,
            recentVehicles,
            recentDiagnoses,
            diagnosisCountsByMonth,
            frequentOBDCodes,
            recentAlerts,
            activeAlerts,
            symptoms,
            rules,
            totalVehicles,
            totalDiagnoses,
            totalOBDCodes,
            totalSymptoms,
            totalRules
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: monthStart } }),
            User.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
            User.find()
                .select("name email role createdAt")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            OBDCode.find()
                .select("code description system severity createdAt")
                .sort({ createdAt: -1 })
                .limit(100)
                .lean(),
            Vehicle.find()
                .select("brand model year user owner createdAt")
                .populate("user", "name email")
                .populate("owner", "name email")
                .sort({ createdAt: -1 })
                .limit(20)
                .lean(),
            Diagnosis.find()
                .select("obdCodes symptoms severity status vehicle user createdAt")
                .populate("vehicle", "brand model year")
                .populate("user", "name")
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            Diagnosis.aggregate([
                { $match: { createdAt: { $gte: chartStart, $lt: chartEnd } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: "$createdAt",
                                timezone: "UTC"
                            }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Diagnosis.aggregate([
                { $unwind: "$obdCodes" },
                { $group: { _id: "$obdCodes", count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "obdcodes",
                        localField: "_id",
                        foreignField: "code",
                        as: "codeDetails"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        code: "$_id",
                        count: 1,
                        description: { $ifNull: [{ $arrayElemAt: ["$codeDetails.description", 0] }, ""] }
                    }
                }
            ]),
            Diagnosis.find({
                createdAt: { $gte: alertStart },
                severity: { $in: ["high", "critical"] }
            })
                .select("obdCodes severity vehicle createdAt")
                .populate("vehicle", "brand model")
                .sort({ createdAt: -1 })
                .limit(5)
                .lean(),
            Diagnosis.countDocuments({
                createdAt: { $gte: alertStart },
                severity: { $in: ["high", "critical"] }
            }),
            Symptom.find()
                .select("name key category description")
                .sort({ name: 1 })
                .limit(100)
                .lean(),
            DiagnosisRule.find()
                .select("name description severity active codesAll codesAny")
                .sort({ createdAt: -1 })
                .limit(100)
                .lean(),
            Vehicle.countDocuments(),
            Diagnosis.countDocuments(),
            OBDCode.countDocuments(),
            Symptom.countDocuments(),
            DiagnosisRule.countDocuments()
        ]);

        return res.status(200).json({
            stats: {
                totalUsers,
                newUsersThisMonth,
                usersByRole: Object.fromEntries(
                    usersByRole.map(({ _id, count }) => [_id, count])
                ),
                totalVehicles,
                totalDiagnoses,
                totalOBDCodes,
                totalSymptoms,
                totalRules,
                activeAlerts
            },
            recentUsers,
            recentOBDCodes,
            recentVehicles,
            recentDiagnoses,
            frequentOBDCodes,
            recentAlerts,
            diagnosisChart: chartMonths.map((month) => ({
                month,
                count: diagnosisCountsByMonth.find((item) => item._id === month)?.count || 0
            })),
            symptoms,
            rules
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors du chargement des statistiques"
        });
    }
};
