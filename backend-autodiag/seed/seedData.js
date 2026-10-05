const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../config/db");

const OBDCode = require("../models/OBDCode");
const Symptom = require("../models/Symptom");
const DiagnosisRule = require("../models/DiagnosisRule");

// Catalogue de codes OBD de démonstration
const obdCodes = [
    {
        code: "P0300",
        description: "Ratés d'allumage multiples ou aléatoires",
        system: "Moteur",
        severity: "high",
        possibleCauses: [
            "Bougies",
            "Bobines",
            "Injecteurs"
        ],
        recommendedChecks: [
            "Contrôler les bougies",
            "Vérifier les bobines",
            "Examiner les injecteurs"
        ]
    },
    {
        code: "P0420",
        description: "Efficacité du catalyseur sous le seuil",
        system: "Échappement",
        severity: "medium",
        possibleCauses: [
            "Catalyseur",
            "Sonde lambda",
            "Fuite d'échappement"
        ],
        recommendedChecks: [
            "Vérifier les sondes lambda",
            "Contrôler les fuites d'échappement"
        ]
    },
    {
        code: "P0171",
        description: "Mélange trop pauvre, banc 1",
        system: "Alimentation moteur",
        severity: "medium",
        possibleCauses: [
            "Prise d'air",
            "Débitmètre",
            "Pression de carburant insuffisante"
        ],
        recommendedChecks: [
            "Vérifier les conduites d'admission",
            "Contrôler les mesures du débitmètre",
            "Vérifier la pression de carburant"
        ]
    }
];

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

        // Remplacement des données de référence
        await OBDCode.deleteMany({});
        await Symptom.deleteMany({});
        await DiagnosisRule.deleteMany({});

        await OBDCode.insertMany(obdCodes);
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