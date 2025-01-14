require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser"); // Importar cookie-parser
const authRoutes = require("./routes/authRoutes");
const recordsRoutes = require("./routes/recordsRoutes");
const reportsRoutes = require("./routes/reportsRoutes");
const app = express();
const fs = require("fs");
const https = require("https");
const path = require("path");

// Configuración de CORS dependiendo del entorno
//para desarrollo nos permitirá conectar backend con frontend de vite.
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? ["https://seahorse-app-b2bks.ondigitalocean.app"] // Dominios permitidos en producción
    : [
        "https://192.168.1.5:5173",
        "https://localhost:5173",
        "https://localhost:3000",
        "https://localhost:4173",
        "https://seahorse-app-b2bks.ondigitalocean.app",
      ]; // Dominios permitidos en desarrollo (tanto en la red como localmente)

// Configurar CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir solicitudes sin origen en cualquier entorno
      if (!origin) {
        callback(null, true); // Permitir solicitudes sin origen
        return;
      }

      // Verificar si el origen está en la lista de permitidos
      if (allowedOrigins.includes(origin)) {
        callback(null, true); // Permitir el origen
      } else {
        callback(new Error("Origen no permitido por CORS"), false); // Rechazar el origen
      }
    },
    credentials: true, // Permitir cookies y credenciales
  })
);

app.use(express.json());
app.use(cookieParser()); // Usar cookie-parser

// Middleware para servir archivos estáticos de la carpeta 'dist'
app.use(express.static(path.join(__dirname, "dist")));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/records", recordsRoutes);
app.use("/api/report", reportsRoutes);

// Ruta para manejar todas las solicitudes no estáticas
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
