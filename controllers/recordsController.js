const { PutItemCommand, ScanCommand, DeleteItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { dynamoDbClient } = require('../config/db');

// Controlador para agregar un nuevo registro
const addRecord = async (req, res) => {
    const { mes, dia, horas, curso } = req.body;
    const usuarioId = req.user.email; // Obtener el email del usuario autenticado desde el token

    // Validación básica de los datos
    if (!mes || !dia || !horas || !curso) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const params = {
        TableName: 'Registros', // Nombre de la tabla en DynamoDB
        Item: {
            Mes: { S: mes }, // El mes como String (formato YYYY-MM)
            Dia: { N: String(dia) },  // El día como número
            Horas: { N: String(horas) }, // Convertimos las horas a String si es un número
            Curso: { S: String(curso) }, // Nombre del curso
            UsuarioId: { S: usuarioId }  // Asociar el registro con el usuario que lo creó
        }
    };

    // Verificar si ya existe un registro para ese día y mes
    const getRecordParams = {
        TableName: 'Registros',
        Key: {
            Mes: { S: mes },
            Dia: { N: String(dia) },
        },
    };

    try {

        const getRecordCommand = new GetItemCommand(getRecordParams);
        const existingRecord = await dynamoDbClient.send(getRecordCommand);

        // Si ya existe el registro, devolver un error
        if (existingRecord.Item) {
            return res.status(400).json({ error: 'Ya existe un registro para ese día' });
        }

        const command = new PutItemCommand(params);
        await dynamoDbClient.send(command); // Insertar el registro en DynamoDB
        res.status(201).json({ message: 'Registro creado con éxito' });
    } catch (error) {
        console.error('Error al guardar el registro en DynamoDB:', error);
        res.status(500).json({ error: 'Error al registrar' });
    }
};

// Controlador para obtener los registros de un mes
const getRecordsByMonth = async (req, res) => {
    const { mes } = req.params;
    const usuarioId = req.user.email; // Obtener el email del usuario autenticado desde el token

    // Validar que el mes esté presente en la URL
    if (!mes) {
        return res.status(400).json({ error: 'Por favor, proporciona un mes' });
    }

    const params = {
        TableName: 'Registros',
        FilterExpression: 'Mes = :mes AND UsuarioId = :usuarioId',
        ExpressionAttributeValues: {
            ':mes': { S: mes },
            ':usuarioId': { S: usuarioId }
        }
    };

    try {
        const command = new ScanCommand(params);
        const { Items } = await dynamoDbClient.send(command); // Obtener los registros de DynamoDB

        if (!Items || Items.length === 0) {
            return res.status(200).json({ records: [] });
        }

        // Transformar los resultados para enviar al cliente
        const records = Items.map((item) => ({
            mes: item.Mes.S,
            dia: item.Dia.N,
            horas: item.Horas.N,
            curso: item.Curso.S,
        }));

        res.status(200).json({ records });
    } catch (error) {
        console.error('Error al obtener registros en DynamoDB:', error);
        res.status(500).json({ error: 'Error al obtener los registros' });
    }
};

// Controlador para eliminar un registro
const deleteRecord = async (req, res) => {
    const { mes, dia } = req.params;  // Obtenemos mes y dia desde los parámetros de la URL
    const usuarioId = req.user.email;  // Obtenemos el email del usuario autenticado

    if (!mes || !dia) {
        return res.status(400).json({ error: 'Por favor, proporciona un mes y un día válidos' });
    }

    const params = {
        TableName: 'Registros',
        Key: {
            Mes: { S: mes },
            Dia: { N: String(dia) }
        },
        // Asegurarnos de que el usuario está eliminando solo sus propios registros
        ConditionExpression: 'UsuarioId = :usuarioId',
        ExpressionAttributeValues: {
            ':usuarioId': { S: usuarioId }
        }
    };

    try {
        const command = new DeleteItemCommand(params);
        await dynamoDbClient.send(command); // Ejecutamos el comando para eliminar el registro

        res.status(200).json({ message: 'Registro eliminado exitosamente' });
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return res.status(403).json({ error: 'Registro no existe' });
        }
        console.error('Error al eliminar el registro en DynamoDB:', error);
        res.status(500).json({ error: 'Error al eliminar el registro' });
    }
};

module.exports = {
    addRecord,
    getRecordsByMonth,
    deleteRecord
};
