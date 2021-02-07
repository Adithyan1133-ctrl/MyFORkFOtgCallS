import { Composer } from 'telegraf';
import { getQueue } from '../tgcalls';
import env from './../env';


export const queueHandler = Composer.command('queue', ctx => {
    const { chat } = ctx.message;

    if (chat.type !== 'supergroup') {
        return;
    }

    const queue = getQueue(chat.id);
    let message = "";
    if (queue && queue.length > 0) {
        queue.forEach((url, index) => {
            if (url.indexOf(env.TG_S_RL) === -1) {
                message += `${index + 1}. ${url}\n`;
            }
            else {
                message += `${index + 1} media\n`;
            }
        });
    }
    else {
        message = 'The queue is empty.';
    }

    if (message != "") {
        ctx.reply(message, {
            reply_to_message_id: ctx.message.message_id
        });
    }
});
