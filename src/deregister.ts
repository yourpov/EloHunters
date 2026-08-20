// love from https://yourpov.dev/

import fs                             from 'fs'
import path                           from 'path'
import { REST, Routes }               from 'discord.js'
import { TOKEN, CLIENT_ID, GUILD_ID } from './config'

const rest     = new REST().setToken(TOKEN)
const hashFile = path.join(__dirname, '..', 'data', 'commands.hash')

rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [] })
    .then(() => {
        try { fs.unlinkSync(hashFile) } catch {}
        console.log('All guild commands removed')
        setTimeout(() => process.exit(0), 0)
    })
    .catch((e) => { console.error(e); setTimeout(() => process.exit(1), 0) })
