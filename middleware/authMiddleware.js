const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Leer el token desde la cookie
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado, no se proporcionó un token' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        // Si el token ha expirado, eliminar la cookie y devolver un mensaje
        if (error.name === 'TokenExpiredError') {
            res.cookie('token', '', { maxAge: 0, httpOnly: true }); // Eliminar la cookie
            return res.status(401).json({ error: 'Token ha expirado' });
        }
        // Si el token es inválido por cualquier otro motivo
        return res.status(400).json({ error: 'Token inválido' });
    }
};

module.exports = authMiddleware;
