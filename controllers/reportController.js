const { dynamoDbClient } = require('../config/db');
const { ScanCommand } = require('@aws-sdk/client-dynamodb');

// Obtener reporte anual (horas por mes)
const getReporteAnual = async (req, res) => {
    const meses = [
        '2024-09', '2024-10', '2024-11', '2024-12', '2025-01',
        '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
        '2025-07', '2025-08'
    ];

    const usuarioId = req.user.email;

    try {
        const reporte = {};

        for (const mes of meses) {
            const params = {
                TableName: 'Registros', // Nombre de tu tabla
                FilterExpression: 'Mes = :mes AND UsuarioId = :usuarioId', // Filtrar por Mes y UsuarioId
                ExpressionAttributeValues: {
                    ':mes': { S: mes },
                    ':usuarioId': { S: usuarioId } // Filtrar por usuario
                }
            };

            const command = new ScanCommand(params);
            const result = await dynamoDbClient.send(command);

            if (result.Items && result.Items.length > 0) {
                const totalHoras = result.Items.reduce((acc, item) => {
                    const horas = item.Horas && item.Horas.N ? parseInt(item.Horas.N, 10) : 0;
                    return acc + horas;
                }, 0);

                reporte[mes] = totalHoras;
            } else {
                reporte[mes] = 0;
            }
        }

        return res.status(200).json({ reporte });
    } catch (error) {
        console.error('Error al obtener el reporte anual:', error);
        return res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    getReporteAnual,
};
