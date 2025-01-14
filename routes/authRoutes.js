const express = require('express');
const { registerUser, loginUser, verifyUser, logoutUser } = require('../controllers/authController');

const authMiddleware = require("../middleware/authMiddleware")

const router = express.Router();

// Ruta de registro
router.post('/register', registerUser);

// Ruta de inicio de sesión
router.post('/login', loginUser);

//Ruta verificacion dashboard
//sirve para cada recarga completa del dashboard se verifique un token valido
router.get('/verify', authMiddleware, verifyUser);

// Ruta de logout con verificación de token
router.post('/logout', authMiddleware, logoutUser);

module.exports = router;
