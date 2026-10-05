const express = require("express");
const cors = require("cors");


const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const obdRoutes = require("./routes/obdRoutes");
const diagnosisRoutes = require("./routes/diagnosisRoutes");
const notFound = require("./middleware/notFoundMiddleware");
const errorHandler = require("./middleware/errorMiddleware");


const connectDB = require("./config/db");


const app = express();

require("dotenv").config();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/obd", obdRoutes);
app.use("/api/diagnosis", diagnosisRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Bienvenue sur AutoDiag"
    });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connexion à la base de données avant le démarrage
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Serveur actif sur le port ${PORT}`);
    });
};

startServer();