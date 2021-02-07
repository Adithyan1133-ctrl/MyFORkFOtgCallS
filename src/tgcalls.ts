// @ts-nocheck 

import { Chat } from 'typegram';
import { exec as _exec, spawn } from 'child_process';
import { JoinVoiceCallResponse } from 'tgcalls/lib/types';
import { promisify } from 'util';
import { Stream, TGCalls } from 'tgcalls';
import env from './env';
import WebSocket from 'ws';
import { Readable } from 'stream';

const exec = promisify(_exec);

interface CachedConnection {
    connection: TGCalls<{ chat: Chat.SupergroupChat }>;
    stream: Stream;
    queue: string[];
    joinResolve?: (value: JoinVoiceCallResponse) => void;
}

const ws = new WebSocket(env.WEBSOCKET_URL);
const cache = new Map<number, CachedConnection>();

const ffmpegOptions = ['-c', 'copy', '-acodec', 'pcm_s16le', '-f', 's16le', '-ac', '1', '-ar', '65000', 'pipe:1'];

ws.on('message', response => {
console.log(response);
    const { _, data } = JSON.parse(response.toString());
console.log(data);
    switch (_) {
        case 'get_join': {
            const connection = cache.get(data.chat_id);
            if (connection) {
                connection.joinResolve?.(data);
            }

            break;
        }

        default:
            break;
    }
});

const downloadSong = async (url: string): Promise<Readable> => {
    let { stdout } = await exec(`youtube-dl --version`);
    console.log(stdout);
    if (url.indexOf('youtu') > -1) {
        let { stdout, stderr } = await exec(`youtube-dl -g -- "${url}"`);
        url = stdout;
    }
    console.log(stdout);
    const ffmpeg = spawn('ffmpeg', ['-y', '-i', url.trim(), ...ffmpegOptions]);
    ffmpeg.stderr.on('data', d => {
        console.log(d.toString());
    })
    // https://t.me/c/1185324811/6567
    return ffmpeg.stdout;
};

const createConnection = async (chat: Chat.SupergroupChat): Promise<void> => {
    if (cache.has(chat.id)) {
        return;
    }

    const connection = new TGCalls({ chat });
    const stream = new Stream();
    const queue: string[] = [];

    const cachedConnection: CachedConnection = {
        connection,
        stream,
        queue,
    };

    connection.joinVoiceCall = payload => {
        return new Promise(resolve => {
            cachedConnection.joinResolve = resolve;

            const data = {
                _: 'join',
                data: {
                    ufrag: payload.ufrag,
                    pwd: payload.pwd,
                    hash: payload.hash,
                    setup: payload.setup,
                    fingerprint: payload.fingerprint,
                    source: payload.source,
                    chat: payload.params.chat,
                },
            };
            ws.send(JSON.stringify(data));
        });
    };

    cache.set(chat.id, cachedConnection);

    stream.on('error', (error) => {
        // handle the error
        console.log(error);
    });

    await connection.start(stream.createTrack());

    stream.on('finish', async () => {
        if (queue.length > 0) {
            const url = queue.shift()!;
            const readable = await downloadSong(url);
            stream.setReadable(readable);
        }
    });
};

export const addToQueue = async (chat: Chat.SupergroupChat, url: string): Promise<number | null> => {
console.log(url);
console.log(chat);
    if (!cache.has(chat.id)) {
        await createConnection(chat);
        return addToQueue(chat, url);
    }

    const { stream, queue } = cache.get(chat.id)!;
console.log(stream);
console.log(queue);
    if (stream.finished) {
        const readable = await downloadSong(url);
        stream.setReadable(readable);
        return 0;
    }

    return queue.push(url);
};

export const getQueue = (chatId: number): string[] | null => {
    if (cache.has(chatId)) {
        const { queue } = cache.get(chatId)!;
        return Array.from(queue);
    }

    return null;
};

export const pause = (chatId: number): boolean | null => {
    if (cache.has(chatId)) {
        const { stream } = cache.get(chatId)!;
        stream.pause();
        return stream.paused;
    }

    return null;
};

export const skip = (chatId: number): boolean => {
    if (cache.has(chatId)) {
        const { stream } = cache.get(chatId)!;
        stream.finish();
        stream.emit('finish');
        return true;
    }

    return false;
};

/**
 * unFINISHed dreams !!!
 */
// export const getFromStream = (chatId: number): Promise<number | null> => {
//     if (cache.has(chatId)) {
//         const { stream, queue } = cache.get(chatId)!;
//     }

//     return null;
// };
