const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../config/db");

const Symptom = require("../models/Symptom");
const DiagnosisRule = require("../models/DiagnosisRule");

// Catalogue des symptômes
const symptoms = [
    {
        name: "Perte de puissance",
        key: "loss_of_power",
        category: "engine"
    },
    {
        name: "Vibrations moteur",
        key: "engine_vibration",
        category: "engine"
    },
    {
        name: "Voyant moteur allumé",
        key: "engine_light",
        category: "engine"
    },
    {
        name: "Consommation élevée",
        key: "high_fuel_consumption",
        category: "engine"
    },
    {
        name: "Fumée noire",
        key: "black_smoke",
        category: "exhaust"
    }
];

// Règles de démonstration
const rules = [
    {
        name: "Ratés d'allumage et perte de puissance",
        description: "Association du code P0300 avec des symptômes moteur",
        symptomsAll: ["loss_of_power"],
        symptomsAny: ["engine_vibration", "engine_light"],
        codesAll: ["P0300"],
        codesAny: [],
        possibleCauses: [
            "Bougies",
            "Bobines",
            "Injecteurs"
        ],
        recommendations: [
            "Contrôler les bougies",
            "Vérifier les bobines",
            "Examiner les injecteurs"
        ],
        severity: "high",
        active: true
    },
    {
        name: "Mélange pauvre et fumée noire",
        description: "Association à vérifier avec le code P0171",
        symptomsAll: [],
        symptomsAny: ["black_smoke", "loss_of_power"],
        codesAll: ["P0171"],
        codesAny: [],
        possibleCauses: [
            "Prise d'air",
            "Débitmètre",
            "Alimentation carburant"
        ],
        recommendations: [
            "Contrôler l'admission",
            "Vérifier les valeurs du débitmètre"
        ],
        severity: "medium",
        active: true
    }
];

// Fonction d'initialisation
const seedDatabase = async () => {
    try {
        await connectDB();

        await Symptom.deleteMany({});
        await DiagnosisRule.deleteMany({});

        await Symptom.insertMany(symptoms);
        await DiagnosisRule.insertMany(rules);

        console.log("Données de démonstration insérées");

        process.exit(0);
    } catch (error) {
        console.error("Erreur du seed :", error);
        process.exit(1);
    }
};

seedDatabase();