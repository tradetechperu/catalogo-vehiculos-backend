const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers["x-admin-token"] || "");
  if (!token) return res.status(401).json({ message: "No autorizado" });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "JWT_SECRET no configurado" });

    const payload = jwt.verify(token, secret);
    req.admin = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `vehiculo-${safe}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Solo imágenes"));
    cb(null, true);
  },
});

router.post("/", requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No se recibió archivo" });

  res.json({
    path: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
  });
});

router.post("/multiple", requireAdmin, (req, res) => {
  upload.array("files", 10)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Error al subir imágenes" });
    if (!req.files || !req.files.length) return res.status(400).json({ message: "No se recibieron archivos" });

    const paths = req.files.map((f) => `/uploads/${f.filename}`);
    return res.json({ paths });
  });
});

module.exports = router;
