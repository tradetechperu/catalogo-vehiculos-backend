const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const vehiculosRouter = require("./routes/vehiculos");
const adminRouter = require("./routes/admin");
const uploadRouter = require("./routes/upload"); // <-- NUEVO

const app = express();

app.use(express.json());

// CORS para React local
app.use(
  cors({
    origin: ["http://localhost:3000"],
  })
);

// Servir imágenes estáticas
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// API
app.use("/api/vehiculos", vehiculosRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter); // <-- NUEVO (esto habilita /api/upload/multiple)

// (Opcional recomendado) error handler JSON para evitar HTML
app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ message: err.message || "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend activo en http://localhost:${PORT}`);
});
