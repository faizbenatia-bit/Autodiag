const mongoose = require("mongoose");

const obdCodeSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        description: {
            type: String,
            required: true
        },

        summary: {
            type: String,
            trim: true
        },

        system: {
            type: String,
            required: true
        },

        severity: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium"
        },

        possibleCauses: [{
            type: String
        }],

        recommendedChecks: [{
            type: String
        }]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("OBDCode", obdCodeSchema);