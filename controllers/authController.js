const bcrypt = require("bcryptjs");
const { PutItemCommand, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { dynamoDbClient } = require("../config/db");
const { generateToken } = require("../utils/generateToken");

// Registrar usuario
const registerUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Por favor, proporciona un email y contraseña" });
  }

  try {
    // Verificar si el usuario ya existe
    const getUserParams = {
      TableName: "Usuarios",
      Key: { email: { S: email } },
    };

    const getUserCommand = new GetItemCommand(getUserParams);
    const existingUser = await dynamoDbClient.send(getUserCommand);

    if (existingUser.Item) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guardar el usuario en DynamoDB
    const putUserParams = {
      TableName: "Usuarios",
      Item: {
        email: { S: email },
        password: { S: hashedPassword },
      },
    };

    const putUserCommand = new PutItemCommand(putUserParams);
    await dynamoDbClient.send(putUserCommand);

    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// Iniciar sesión
const loginUser = async (req, res) => {
  const { rut, password } = req.body;

  if (!rut || !password) {
    return res
      .status(400)
      .json({ error: "Por favor, proporciona un rut y contraseña" });
  }

  try {
    // Verificar si el usuario existe
    const getUserParams = {
      TableName: "UsuariosMk",
      Key: { rut: { S: rut } },
    };

    const getUserCommand = new GetItemCommand(getUserParams);
    const user = await dynamoDbClient.send(getUserCommand);

    if (!user.Item) {
      return res.status(400).json({ error: "El usuario no existe" });
    }

    // Comparar la contraseña
    const isMatch = await bcrypt.compare(password, user.Item.password.S);

    if (!isMatch) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    // Generar el token JWT
    const token = generateToken(rut);

    // Establecer el token en una cookie segura
    res.cookie("token", token, {
      httpOnly: true, // Protege contra XSS
      secure: true, // Solo en HTTPS en producción
      sameSite: "None", // Previene ataques CSRF
      maxAge: 3600000, // 1 hora de expiración
    });

    res.json({ message: "Inicio de sesión exitoso" });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const verifyUser = (req, res) => {
  // Si llegamos aquí, el token ha sido verificado y es válido
  res.status(200).json({
    message: "Autenticado",
    user: req.user, // Puedes devolver los datos decodificados del token si es necesario
  });
};

const logoutUser = (req, res) => {
  try {
    // Eliminar la cookie 'token' configurada previamente
    res.cookie("token", "", { maxAge: 0, httpOnly: true });

    // Enviar respuesta indicando que el logout fue exitoso
    return res.status(200).json({ message: "Sesión cerrada exitosamente" });
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return res.status(500).json({ error: "Error al cerrar sesión" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyUser,
  logoutUser,
};
