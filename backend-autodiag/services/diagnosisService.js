const OBDCode = require("../models/OBDCode");
const DiagnosisRule = require("../models/DiagnosisRule");

const matchesRule = (rule, codes) => {
    const allCodesMatch = rule.codesAll.every(
        code => codes.includes(code)
    );

    const anyCodesMatch =
        rule.codesAny.length === 0 ||
        rule.codesAny.some(
            code => codes.includes(code)
        );

    const hasCodeConditions = rule.codesAll.length > 0 || rule.codesAny.length > 0;

    return hasCodeConditions &&
        allCodesMatch &&
        anyCodesMatch;
};

// Fonction principale d'analyse
const analyzeVehicle = async ({ obdCodes }) => {

    // Normaliser les codes
    const normalizedCodes = obdCodes.map(
        code => code.trim().toUpperCase()
    );

    // Charger les données de référence
    const [obdResults, rules] = await Promise.all([
            OBDCode.find({
                code: { $in: normalizedCodes }
            }),

            DiagnosisRule.find({
                active: true
            })
        ]);

    // Identifier les données inconnues
    const knownCodes = obdResults.map(
        item => item.code
    );

    const unknownCodes = normalizedCodes.filter(
        code => !knownCodes.includes(code)
    );

    // Appliquer les règles
    const matchedRules = rules.filter(
        rule => matchesRule(rule, knownCodes)
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
        codeDetails: obdResults.map(item => ({
            code: item.code,
            description: item.description,
            severity: item.severity,
            possibleCauses: item.possibleCauses,
            recommendations: item.recommendedChecks
        })),
        unknownCodes,

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