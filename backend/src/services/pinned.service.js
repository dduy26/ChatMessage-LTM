const prisma = require("../config/prisma");

class PinnedService {
    static async pinnedToggle(userId, conversationId) {{
        const existing = await prisma.pinnedConversation.findUnique({
    }
}