const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { addRecord, getRecordsByMonth, deleteRecord } = require('../controllers/recordsController');

// Ruta para insertar un registro (protegida por authMiddleware)
router.post('/add', authMiddleware, addRecord);

// Ruta protegida para obtener los registros de un mes
router.get('/:mes', authMiddleware, getRecordsByMonth);

// Ruta protegida para eliminar un registro
router.delete('/:mes/:dia', authMiddleware, deleteRecord);
module.exports = router;
