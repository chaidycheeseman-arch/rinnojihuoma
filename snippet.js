function normalizePrivateContactChatReplyText(value) {



    return String(value || '')



        .replace(/\r\n/g, '\n')



        .replace(/^```(?:json)?\s*/i, '')



        .replace(/\s*```$/i, '')



        .trim();

}
