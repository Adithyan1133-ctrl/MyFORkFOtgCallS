import { cleanEnv, str } from 'envalid';
import dotenv from 'dotenv';

dotenv.config();

export default cleanEnv(process.env, {
    BOT_TOKEN: str(),
    WEBSOCKET_URL: str(),
    TG_M_ID: str(),
    TG_S_RL: str(),
});
