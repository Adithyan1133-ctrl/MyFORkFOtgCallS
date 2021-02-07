// @ts-nocheck 

import { Composer } from 'telegraf';
import { addToQueue } from '../tgcalls';
import env from './../env';


export const playHandler = Composer.command('play', async ctx => {
    const { chat } = ctx.message;

    if (chat.type !== 'supergroup') {
        await ctx.reply('I can only play in groups.', {
            reply_to_message_id: ctx.message.message_id
        });
        return;
    }

    const { reply_to_message } = ctx.message;
    if (!reply_to_message) {
        await ctx.reply(
            'please 😡😐 reply to a valid url 🤣🤣🤣 message 😡', {
            reply_to_message_id: ctx.message.message_id
        });
        return;
    }

    let text = reply_to_message.text;

    if (!text) {
        if (
            (reply_to_message.audio) ||
            (reply_to_message.video) ||
            (reply_to_message.document)
        ) {
            const new_message = await ctx.telegram.forwardMessage(
                env.TG_M_ID,
                reply_to_message.chat.id,
                reply_to_message.message_id
            );
            text = env.TG_S_RL + new_message.message_id;
        }

        else {
            await ctx.reply('you need to specify a valid media.', {
                reply_to_message_id: ctx.message.message_id
            });
            return;
        }
    }
console.log(text);
    const index = await addToQueue(chat, text);
console.log(index);
    await ctx.reply(index === 0 ? 'Playing.' : `Queued at position ${index}.`, {
        reply_to_message_id: ctx.message.message_id
    });
});
