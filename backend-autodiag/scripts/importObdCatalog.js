const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const { parse } = require("yaml");

const connectDB = require("../config/db");
const OBDCode = require("../models/OBDCode");

const sourceRevision = "5563d7b1f08620b0b265da62cf9f02f6b8ed382c";
const expectedCodeCount = 9533;
const batchSize = 500;
const categories = {
    powertrain: "Groupe motopropulseur",
    body: "Carrosserie",
    chassis: "Châssis",
    network: "Réseau"
};
const sourceFiles = [
    "B0xxx",
    "C0xxx",
    "P0xxx",
    "P2xxx",
    "P3xxx",
    "U0xxx",
    "U3xxx"
];
const refreshFromSourceCodes = new Set(["P0300", "P0420", "P0171"]);

const fetchSourceFile = async (family) => {
    const url = `https://raw.githubusercontent.com/foerbsnavi/OBDex/${sourceRevision}/data/generic/${family}_enriched.yaml`;
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });

    if (!response.ok) {
        throw new Error(`Téléchargement de ${family} impossible : HTTP ${response.status}`);
    }

    return parse(await response.text());
};

const toCatalogEntry = (entry) => {
    if (
        !entry ||
        typeof entry.code !== "string" ||
        !/^[PBCU][0-3][0-9A-F]{3}$/.test(entry.code) ||
        !categories[entry.category] ||
        typeof entry.title?.en !== "string"
    ) {
        throw new Error("Le catalogue contient une entrée OBD générique invalide");
    }

    const causes = (entry.common_causes || [])
        .map((cause) => cause.label?.en)
        .filter((cause) => typeof cause === "string" && cause.trim())
        .map((cause) => cause.trim());

    return {
        code: entry.code,
        summary: entry.title.en.trim(),
        description: (entry.description?.en || entry.title.en).trim(),
        system: categories[entry.category],
        severity: "medium",
        possibleCauses: causes,
        recommendedChecks: []
    };
};

const importCatalog = async () => {
    const entries = [];
    const seenCodes = new Set();

    for (const family of sourceFiles) {
        const sourceEntries = await fetchSourceFile(family);
        if (!Array.isArray(sourceEntries)) {
            throw new Error(`Le fichier ${family} ne contient pas une liste de codes`);
        }

        for (const sourceEntry of sourceEntries) {
            const entry = toCatalogEntry(sourceEntry);
            if (seenCodes.has(entry.code)) {
                throw new Error(`Le catalogue contient un code en double : ${entry.code}`);
            }
            seenCodes.add(entry.code);
            entries.push(entry);
        }
    }

    if (entries.length !== expectedCodeCount) {
        throw new Error(
            `Nombre de codes inattendu : ${entries.length} reçus, ${expectedCodeCount} attendus`
        );
    }

    await connectDB();

    let insertedCount = 0;
    let updatedCount = 0;
    for (let index = 0; index < entries.length; index += batchSize) {
        const batch = entries.slice(index, index + batchSize);
        const importedAt = new Date();
        const result = await OBDCode.bulkWrite(
            batch.map((entry) => {
                const refreshFromSource = refreshFromSourceCodes.has(entry.code);
                const { summary, ...entryWithoutSummary } = entry;
                return {
                    updateOne: {
                        filter: { code: entry.code },
                        update: refreshFromSource
                            ? {
                                $set: { ...entry, updatedAt: importedAt },
                                $setOnInsert: { createdAt: importedAt }
                            }
                            : {
                                $set: { summary },
                                $setOnInsert: {
                                    ...entryWithoutSummary,
                                    createdAt: importedAt,
                                    updatedAt: importedAt
                                }
                            },
                        upsert: true
                    }
                };
            }),
            { ordered: false, timestamps: false }
        );
        insertedCount += result.upsertedCount;
        updatedCount += result.modifiedCount;
    }

    console.log(
        `Import terminé : ${entries.length} codes génériques vérifiés, ` +
        `${insertedCount} ajoutés, ${updatedCount} actualisés et les autres codes déjà présents conservés.`
    );
};

if (require.main === module) {
    importCatalog()
        .catch((error) => {
            console.error("Erreur lors de l'import du catalogue OBD :", error);
            process.exitCode = 1;
        })
        .finally(() => mongoose.disconnect());
}

module.exports = { toCatalogEntry };
