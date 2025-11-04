const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token requerido" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Si el token ha expirado
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
                    error: "token_expired"
                });
            }
            // Si el token es inválido (malformado, firma incorrecta, etc.)
            if (err.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: "Token inválido. Por favor, inicia sesión nuevamente.",
                    error: "token_invalid"
                });
            }
            // Cualquier otro error relacionado con JWT
            return res.status(401).json({ 
                message: "Error de autenticación. Por favor, inicia sesión nuevamente.",
                error: "token_error"
            });
        }
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;