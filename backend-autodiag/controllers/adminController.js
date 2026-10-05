const Diagnosis = require("../models/Diagnosis");
const DiagnosisRule = require("../models/DiagnosisRule");
const OBDCode = require("../models/OBDCode");
const Symptom = require("../models/Symptom");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");

exports.getDashboardStats = async (req, res) => {
    try {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [
            totalUsers,
            newUsersThisMonth,
            usersByRole,
            recentUsers,
            recentOBDCodes,
            recentVehicles,
            recentDiagnoses,
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
                totalRules
            },
            recentUsers,
            recentOBDCodes,
            recentVehicles,
            recentDiagnoses,
            symptoms,
            rules
        });
    } catch (error) {
        return res.status(500).json({
            message: "Erreur lors du chargement des statistiques"
        });
    }
};
