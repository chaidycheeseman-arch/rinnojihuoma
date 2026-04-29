const [siteUrl, adminKey, deviceCode, ...noteParts] = process.argv.slice(2);

function fail(message) {
    console.error(message);
    process.exit(1);
}

if (!siteUrl || !adminKey || !deviceCode) {
    fail('用法: node scripts/issue-device-license.js <站点地址> <管理员密钥> <设备码> [备注]');
}

const target = String(siteUrl).replace(/\/+$/, '') + '/.netlify/functions/generate-code';
const note = noteParts.join(' ').trim();

(async () => {
    const response = await fetch(target, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Key': adminKey
        },
        body: JSON.stringify({
            deviceCode,
            note
        })
    });

    let payload = {};
    try {
        payload = await response.json();
    } catch (error) {
        payload = {};
    }

    if (!response.ok) {
        fail(payload.message || `签发失败: ${response.status}`);
    }

    console.log('设备码:', payload.initialDeviceCode);
    console.log('激活码:', payload.activationCode);
    console.log('说明:', payload.message || '签发成功');
})();
