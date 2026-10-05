const mongoose = require("mongoose");

const diagnosisRuleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        // Tous ces symptômes doivent être présents
        symptomsAll: [{
            type: String
        }],

        // Au moins un de ces symptômes doit être présent
        symptomsAny: [{
            type: String
        }],

        // Tous ces codes doivent être présents
        codesAll: [{
            type: String
        }],

        // Au moins un de ces codes doit être présent
        codesAny: [{
            type: String
        }],

        possibleCauses: [{
            type: String
        }],

        recommendations: [{
            type: String
        }],

        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "DiagnosisRule",
    diagnosisRuleSchema
);