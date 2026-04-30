const {
    DEVICE_CODE_LENGTH,
    JSON_HEADERS,
    allocateUniqueDeviceCode,
    formatDeviceCode,
    json
} = require('./_license');

exports.handler = async function handler(event) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: JSON_HEADERS,
            body: ''
        };
    }

    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return json(405, {
            ok: false,
            message: 'Method Not Allowed'
        });
    }

    try {
        const issued = await allocateUniqueDeviceCode({
            source: 'browser'
        });

        return json(200, {
            ok: true,
            deviceCode: issued.deviceCode,
            formattedDeviceCode: formatDeviceCode(issued.deviceCode),
            length: DEVICE_CODE_LENGTH,
            message: 'Unique device code allocated.'
        });
    } catch (error) {
        console.error('Device code allocation failed:', error);
        return json(500, {
            ok: false,
            message: 'Unable to allocate a unique device code.'
        });
    }
};
