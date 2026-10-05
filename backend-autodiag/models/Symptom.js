const mongoose = require("mongoose");

const symptomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        key: {
            type: String,
            required: true,
            unique: true
        },

        category: {
            type: String,
            enum: [
                "engine",
                "exhaust",
                "electrical",
                "braking",
                "transmission",
                "other"
            ],
            required: true
        },

        description: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Symptom", symptomSchema);