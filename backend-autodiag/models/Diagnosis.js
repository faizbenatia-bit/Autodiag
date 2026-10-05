const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
    {
        
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true
        },

        symptoms: [{
            type: String
        }],

        obdCodes: [{
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
            enum: ["low", "medium", "high", "critical", "unknown"],
            default: "unknown"
        },

        status: {
            type: String,
            enum: ["pending", "reviewed", "confirmed"],
            default: "pending"
        },

        mechanicNotes: {
            type: String,
            default: ""
        },

        findings: [{
            ruleId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "DiagnosisRule"
            },
            name: String,
            description: String,
            severity: String
        }]
        
    },

    {
        timestamps: true
    }


);

module.exports = mongoose.model("Diagnosis", diagnosisSchema);