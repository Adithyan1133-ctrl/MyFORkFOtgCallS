// @ts-nocheck 

import { Composer } from 'telegraf';

export const leaveChatsHandler = Composer.on("new_chat_members", async ctx => {
    const { chat } = ctx.message;

    ctx.message.new_chat_members.forEach(async element => {
        if (element.id === ctx.botInfo.id) {
            if (!chat.username) {
                await ctx.reply(
                    "設定 Username 後，可以給您和朋友們帶來許多方便喔！", {
                        reply_to_message_id: ctx.message.message_id
                    }
                );
                await ctx.leaveChat();
                return
            }
        }
    });
});
