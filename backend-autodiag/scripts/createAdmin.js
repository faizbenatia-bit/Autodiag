require("dotenv").config();

const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

const createAdmin = async () => {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error(
            "Définissez ADMIN_NAME, ADMIN_EMAIL et ADMIN_PASSWORD dans l'environnement."
        );
    }

    if (ADMIN_PASSWORD.length < 8) {
        throw new Error("ADMIN_PASSWORD doit contenir au moins 8 caractères.");
    }

    await connectDB();

    const existingAdmin = await User.findOne({ role: "admin" }).select("_id");
    if (existingAdmin) {
        throw new Error("Un compte administrateur existe déjà.");
    }

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existingUser = await User.findOne({ email }).select("_id");
    if (existingUser) {
        throw new Error("Cet email est déjà utilisé par un autre compte.");
    }

    const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
        name: ADMIN_NAME.trim(),
        email,
        password,
        role: "admin"
    });

    console.log(`Compte administrateur créé pour ${email}.`);
};

createAdmin()
    .catch((error) => {
        console.error(`Création de l'administrateur impossible : ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        const mongoose = require("mongoose");
        await mongoose.disconnect();
    });
