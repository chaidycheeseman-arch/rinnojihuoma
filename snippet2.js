function buildPrivateContactChatEndpoint(rawEndpoint) {
    const raw = String(rawEndpoint || '').trim();
    if (!/^https?:\/\//i.test(raw)) {
        throw new Error('Please enter an http or https API endpoint first.');
    }
    const url = new URL(raw);
    url.search = '';
    url.hash = '';
    if (/\/chat\/completions\/?$/i.test(url.pathname)) return url.toString();
    if (/\/models\/?$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/models\/?$/i, '/chat/completions');
        return url.toString();
    }
    url.pathname = url.pathname.replace(/\/+$/, '') + '/chat/completions';
    return url.toString();
}

function extractPrivateContactGeneratedText(payload) {
    const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
    return String(
        choice?.message?.content
        || choice?.text
        || payload?.output_text
        || payload?.content
        || ''
    ).trim();
}

function normalizePrivateContactChatReplyText(value) {
    return String(value || '')
        .replace(/\r\n/g, '\n')
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
}

if (typeof module !== 'undefined') {
    module.exports = {
        buildPrivateContactChatEndpoint,
        extractPrivateContactGeneratedText,
        normalizePrivateContactChatReplyText
    };
}
