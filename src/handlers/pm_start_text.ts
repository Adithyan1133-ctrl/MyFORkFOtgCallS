import { Composer } from 'telegraf';


export const pmStartHandler = Composer.command('start', ctx => {
    const { chat } = ctx.message;

    if (chat.type !== 'private') {
        return;
    }

    ctx.reply(
        "Bot Powered by @pit_DBAAS and @OtherBots", {
            reply_to_message_id: ctx.message.message_id
        }
    );
});
