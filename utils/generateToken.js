const jwt = require("jsonwebtoken");

const generateToken = (rut) => {
  return jwt.sign({ rut }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

module.exports = { generateToken };
