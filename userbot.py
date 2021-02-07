import asyncio
import aiohttp

import json
import os
from json.decoder import JSONDecodeError

from aiohttp import web
from aiohttp.http_websocket import WSMsgType

from dotenv import load_dotenv

from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.functions.channels import GetFullChannelRequest
from telethon.tl.functions.phone import GetGroupCallRequest
from telethon.tl.functions.phone import JoinGroupCallRequest
from telethon.tl.types import DataJSON

load_dotenv()

client = TelegramClient(
    StringSession(os.environ['HU_STRING_SESSION']),
    os.environ['API_ID'],
    os.environ['API_HASH'],
)
client.start()

tg_bot = TelegramClient(
    "TeleThonBot",
    os.environ['API_ID'],
    os.environ['API_HASH'],
)
tg_bot.start(bot_token=os.environ['BOT_TOKEN'])


async def get_entity(chat):
    try:
        return await client.get_input_entity(chat['id'])
    except ValueError:
        if 'username' in chat:
            return await client.get_entity(chat['username'])
        raise


async def leave_chat(data, reason):
    try:
        await tg_bot.send_message(
            entity=data['chat']['id'],
            message=reason
        )
    except:
        pass
    try:
        await tg_bot.delete_dialog(
            entity=data['chat']['id']
        )
    except:
        pass


async def join_call(data):
    chat = None
    try:
        chat = await get_entity(data['chat'])
    except ValueError:
        await leave_chat(data, (
            "😶 設定 Username 😡 後，可以給您和朋友們帶來許多方便喔 😐"
        ))
        return
    try:
        full_chat = await client(GetFullChannelRequest(chat))
    except:
        return
    if not full_chat.full_chat.call:
        await leave_chat(data, (
            "😡 please 😐 start 😡 @GroupCall 😡 "
            "first, before using 😡😡 commands 😶"
        ))
        return
    call = await client(GetGroupCallRequest(full_chat.full_chat.call))

    result = await client(
        JoinGroupCallRequest(
            call=call.call,
            muted=False,
            params=DataJSON(
                data=json.dumps({
                    'ufrag': data['ufrag'],
                    'pwd': data['pwd'],
                    'fingerprints': [{
                        'hash': data['hash'],
                        'setup': data['setup'],
                        'fingerprint': data['fingerprint'],
                    }],
                    'ssrc': data['source'],
                }),
            ),
        ),
    )

    transport = json.loads(result.updates[0].call.params.data)['transport']

    return {
        '_': 'get_join',
        'data': {
            'chat_id': data['chat']['id'],
            'transport': {
                'ufrag': transport['ufrag'],
                'pwd': transport['pwd'],
                'fingerprints': transport['fingerprints'],
                'candidates': transport['candidates'],
            },
        },
    }


async def websocket_handler(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)

    async for msg in ws:
        if msg.type == WSMsgType.TEXT:
            try:
                data = json.loads(msg.data)
            except JSONDecodeError:
                await ws.close()
                break

            response = None
            if data['_'] == 'join':
                response = await join_call(data['data'])

            if response is not None:
                await ws.send_json(response)

    return ws


def main():
    app = web.Application()
    app.router.add_route('GET', '/', websocket_handler)
    PORT = int(os.environ.get("PORT", "1390"))
    web.run_app(app, port=PORT)


async def hack_y_shit():
    BOT_TOKEN = os.environ['BOT_TOKEN']
    async with aiohttp.ClientSession() as session:
        one_r = await session.get(
            f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset=-1"
        )
        print(await one_r.text())

if __name__ == '__main__':
    # Then we need a loop to work with
    loop = asyncio.get_event_loop()
    # Then, we need to run the loop with a task
    loop.run_until_complete(hack_y_shit())
    print("USERBOT")
    main()
