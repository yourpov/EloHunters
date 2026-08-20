// love from https://yourpov.dev/

import { Client, GatewayIntentBits, Partials } from 'discord.js'
import fs                                      from 'fs'
import path                                    from 'path'
import type { Event }                          from './types'
import { TOKEN }                               from './config'
import { close as closeDb }                    from './data/db'

function isBotProcess(pid: number): boolean {
    try {
        process.kill(pid, 0)
        return true
    } catch { return false }
}

const pidFile = path.join(__dirname, '..', 'data', 'bot.pid')
fs.mkdirSync(path.dirname(pidFile), { recursive: true })
if (fs.existsSync(pidFile)) {
    const old = parseInt(fs.readFileSync(pidFile, 'utf-8'), 10)
    if (!Number.isNaN(old) && old !== process.pid && isBotProcess(old)) {
        console.error(`Bot already running (PID ${old}). Exiting.`)
        process.exit(1)
    }
}
fs.writeFileSync(pidFile, String(process.pid))
process.on('exit', () => { closeDb(); try { fs.unlinkSync(pidFile) } catch { } })
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))
process.on('uncaughtException', (err) => { console.error('Uncaught:', err); process.exit(1) })

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
    partials: [Partials.Message],
})

const eventsDir = path.join(__dirname, 'events')
for (const file of fs.readdirSync(eventsDir).filter(f => f.endsWith('.js') || f.endsWith('.ts'))) {
    const mod = require(path.join(eventsDir, file)) as { event?: Event }
    if (!mod.event) continue
    const { name, once, run } = mod.event
    if (once) client.once(name, run)
    else client.on(name, run)
}

client.on('error', err => {
    if ('errors' in err && Array.isArray((err as AggregateError).errors)) {
        for (const e of (err as AggregateError).errors) console.error('Client error:', e)
    } else {
        console.error('Client error:', err)
    }
})
process.on('unhandledRejection', err => console.error('Unhandled:', err))

client.login(TOKEN)
