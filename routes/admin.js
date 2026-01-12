const express = require("express");
const fs = require("fs");
const path = require("path");
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");

const router = express.Router();
const DATA_FILE = path.join(__dirname, "..", "data", "vehiculos.json");

function readVehiculos() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeVehiculos(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers["x-admin-token"] || "");

  if (!token) return res.status(401).json({ message: "No autorizado" });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "JWT_SECRET no configurado" });

    const payload = jwt.verify(token, secret);
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

// Login: devuelve JWT
router.post("/login", (req, res) => {
  const { user, pass } = req.body || {};
  if (!user || !pass) return res.status(400).json({ message: "Faltan credenciales" });

  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "JWT_SECRET no configurado" });

    const token = jwt.sign(
      { sub: user, role: "admin" },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return res.json({ token });
  }

  return res.status(401).json({ message: "Credenciales inválidas" });
});

// Listar (admin)
router.get("/vehiculos", requireAdmin, (req, res) => {
  res.json(readVehiculos());
});

// Crear
router.post("/vehiculos", requireAdmin, (req, res) => {
  const list = readVehiculos();
  const body = req.body || {};

  const nuevo = {
    id: nanoid(10),
    marca: body.marca || "",
    modelo: body.modelo || "",
    anio: Number(body.anio) || null,
    precio: Number(body.precio) || null,
    kilometraje: Number(body.kilometraje) || null,
    transmision: body.transmision || "",
    combustible: body.combustible || "",
    pasajeros: body.pasajeros === null || body.pasajeros === undefined ? null : Number(body.pasajeros),
    color: body.color || "",
    fotoPrincipal: body.fotoPrincipal || "",
    galeriaFotos: Array.isArray(body.galeriaFotos) ? body.galeriaFotos : [],
    caracteristicas: Array.isArray(body.caracteristicas) ? body.caracteristicas : [],
  };

  list.unshift(nuevo);
  writeVehiculos(list);
  res.status(201).json(nuevo);
});

// Editar
router.put("/vehiculos/:id", requireAdmin, (req, res) => {
  const list = readVehiculos();
  const idx = list.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "No encontrado" });

  const body = req.body || {};
  const curr = list[idx];

  const updated = {
    ...curr,
    marca: body.marca ?? curr.marca,
    modelo: body.modelo ?? curr.modelo,
    anio: body.anio !== undefined ? (body.anio === null ? null : Number(body.anio)) : curr.anio,
    precio: body.precio !== undefined ? (body.precio === null ? null : Number(body.precio)) : curr.precio,
    kilometraje:
      body.kilometraje !== undefined ? (body.kilometraje === null ? null : Number(body.kilometraje)) : curr.kilometraje,
    transmision: body.transmision ?? curr.transmision,
    combustible: body.combustible ?? curr.combustible,
    pasajeros: body.pasajeros === null || body.pasajeros === undefined ? null : Number(body.pasajeros),
    color: body.color ?? curr.color,
    fotoPrincipal: body.fotoPrincipal ?? curr.fotoPrincipal,
    galeriaFotos: Array.isArray(body.galeriaFotos) ? body.galeriaFotos : curr.galeriaFotos,
    caracteristicas: Array.isArray(body.caracteristicas) ? body.caracteristicas : curr.caracteristicas,
  };

  list[idx] = updated;
  writeVehiculos(list);
  res.json(updated);
});

// Eliminar
router.delete("/vehiculos/:id", requireAdmin, (req, res) => {
  const list = readVehiculos();
  const idx = list.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "No encontrado" });

  const removed = list.splice(idx, 1)[0];
  writeVehiculos(list);
  res.json({ ok: true, removed });
});

module.exports = router;
