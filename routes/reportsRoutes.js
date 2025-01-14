const express = require('express');
const router = express.Router();
const { getReporteAnual } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

// Ruta para obtener el reporte anual de horas por mes
router.get('/anual', authMiddleware, getReporteAnual);

module.exports = router;
