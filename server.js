const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const planesRouter = require("./routes/planes");
const vehiculosRouter = require("./routes/vehiculos");
const uploadRouter = require("./routes/upload");
const adminPlanesRouter = require("./routes/adminPlanes");

const app = express();

// ===== CORS PRIMERO =====
const allowedOrigins = [
  "http://localhost:3000",
  "https://catalogovehiculos.netlify.app",
];

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true); // curl/healthchecks
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-token"],
    credentials: false,
  })
);

// Preflight para todo
app.options(/.*/, cors());

// ===== BODY PARSER =====
app.use(express.json());

// ===== STATIC FILES =====
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// ===== HEALTH =====
app.get("/health", (req, res) => res.json({ ok: true }));

// ===== API PUBLICA =====
app.use("/api/planes", planesRouter);       // público: listado/ detalle planes
app.use("/api/vehiculos", vehiculosRouter); // si aún lo dejas

// ===== API ADMIN =====
app.use("/api/admin", adminPlanesRouter);   // admin login + CRUD planes (y lo que pongas allí)
app.use("/api/upload", uploadRouter);       // uploads

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend activo en http://localhost:${PORT}`));
