import { bot } from '../bot';

import { leaveChatsHandler } from './leave';
import { playHandler } from './play';
import { queueHandler } from './queue';
import { pauseHandler } from './pause';
import { skipHandler } from './skip';
import { pmStartHandler } from './pm_start_text';

export const initHandlers = (): void => {
    bot.use(leaveChatsHandler);
    bot.use(playHandler);
    bot.use(queueHandler);
    bot.use(pauseHandler);
    bot.use(skipHandler);
    bot.use(pmStartHandler);
    bot.catch(function (err) {
        console.log(err);
    });
};
