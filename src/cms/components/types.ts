/** Ответ обработчика приглашения: срок ссылки при успехе, причина при отказе. */
export type ReviewInviteResponse = { ok: true; expiresAt: string } | { ok: false; reason?: string };
