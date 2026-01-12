const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DATA_FILE = path.join(__dirname, "..", "data", "vehiculos.json");

function readVehiculos() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

router.get("/", (req, res) => {
  const vehiculos = readVehiculos();
  res.json(vehiculos);
});

router.get("/:id", (req, res) => {
  const vehiculos = readVehiculos();
  const v = vehiculos.find((x) => x.id === req.params.id);
  if (!v) return res.status(404).json({ message: "Vehículo no encontrado" });
  res.json(v);
});

module.exports = router;
