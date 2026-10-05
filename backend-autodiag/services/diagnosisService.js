const OBDCode = require("../models/OBDCode");
const Symptom = require("../models/Symptom");
const DiagnosisRule = require("../models/DiagnosisRule");

// Vérifie si une règle correspond aux données reçues
const matchesRule = (rule, symptoms, codes) => {

    // Tous les symptômes obligatoires doivent être présents
    const allSymptomsMatch = rule.symptomsAll.every(
        symptom => symptoms.includes(symptom)
    );

    // Au moins un symptôme facultatif doit correspondre
    const anySymptomsMatch =
        rule.symptomsAny.length === 0 ||
        rule.symptomsAny.some(
            symptom => symptoms.includes(symptom)
        );

    // Tous les codes obligatoires doivent être présents
    const allCodesMatch = rule.codesAll.every(
        code => codes.includes(code)
    );

    // Au moins un code alternatif doit correspondre
    const anyCodesMatch =
        rule.codesAny.length === 0 ||
        rule.codesAny.some(
            code => codes.includes(code)
        );

    // Une règle doit contenir au moins une condition
    const hasConditions =
        rule.symptomsAll.length > 0 ||
        rule.symptomsAny.length > 0 ||
        rule.codesAll.length > 0 ||
        rule.codesAny.length > 0;

    return hasConditions &&
        allSymptomsMatch &&
        anySymptomsMatch &&
        allCodesMatch &&
        anyCodesMatch;
};

// Fonction principale d'analyse
const analyzeVehicle = async ({ symptoms, obdCodes }) => {

    // Normaliser les codes
    const normalizedCodes = obdCodes.map(
        code => code.trim().toUpperCase()
    );

    // Charger les données de référence
    const [obdResults, symptomResults, rules] =
        await Promise.all([
            OBDCode.find({
                code: { $in: normalizedCodes }
            }),

            Symptom.find({
                $or: [
                    { key: { $in: symptoms } },
                    { name: { $in: symptoms } }
                ]
            }),

            DiagnosisRule.find({
                active: true
            })
        ]);

    // Identifier les données inconnues
    const knownCodes = obdResults.map(
        item => item.code
    );

    const knownSymptoms = symptomResults.map(item => item.key);
    const knownSymptomNames = new Set(
        symptomResults.flatMap(item => [item.key, item.name])
            .map(symptom => symptom.toLocaleLowerCase())
    );

    const unknownCodes = normalizedCodes.filter(
        code => !knownCodes.includes(code)
    );

    const unknownSymptoms = symptoms.filter(
        symptom => !knownSymptomNames.has(symptom.toLocaleLowerCase())
    );

    // Appliquer les règles
    const matchedRules = rules.filter(
        rule => matchesRule(
            rule,
            knownSymptoms,
            knownCodes
        )
    );

    // Regrouper les causes
    const possibleCauses = [
        ...new Set(
            [
                ...matchedRules.flatMap(rule => rule.possibleCauses),
                ...obdResults.flatMap(item => item.possibleCauses)
            ]
        )
    ];

    // Regrouper les recommandations
    const recommendations = [
        ...new Set(
            [
                ...matchedRules.flatMap(rule => rule.recommendations),
                ...obdResults.flatMap(item => item.recommendedChecks)
            ]
        )
    ];

    // Déterminer le niveau de priorité
    const severityOrder = [
        "low",
        "medium",
        "high",
        "critical"
    ];

    const matchedSeverities = [
        ...matchedRules.map(rule => rule.severity),
        ...obdResults.map(item => item.severity)
    ];

    const severity = matchedSeverities.length > 0
        ? matchedSeverities.reduce((highest, current) =>
            severityOrder.indexOf(current) >
            severityOrder.indexOf(highest)
                ? current
                : highest
        )
        : "unknown";

    return {
        matchedCodes: knownCodes,
        matchedSymptoms: knownSymptoms,
        codeDetails: obdResults.map(item => ({
            code: item.code,
            description: item.description,
            severity: item.severity,
            possibleCauses: item.possibleCauses,
            recommendations: item.recommendedChecks
        })),
        unknownCodes,
        unknownSymptoms,

        findings: matchedRules.map(rule => ({
            ruleId: rule._id,
            name: rule.name,
            description: rule.description,
            severity: rule.severity
        })),

        possibleCauses,
        recommendations,
        severity
    };
};

module.exports = { analyzeVehicle };