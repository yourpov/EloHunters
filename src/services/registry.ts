// love from https://yourpov.dev/

import fs                             from 'fs'
import path                           from 'path'
import crypto                         from 'crypto'
import { Collection, REST, Routes }   from 'discord.js'
import type { Command }               from '../types'
import { TOKEN, CLIENT_ID, GUILD_ID } from '../config'

const commands  = new Collection<string, Command>()
const rest      = new REST().setToken(TOKEN)
const HASH_FILE = path.join(__dirname, '..', '..', 'data', 'commands.hash')

export function load(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) { load(full); continue }
        if (!entry.name.endsWith('.js') && !entry.name.endsWith('.ts')) continue
        const mod = require(full) as { command?: Command }
        if (mod.command) commands.set(mod.command.slash.name, mod.command)
    }
}

export function get(name: string): Command | undefined {
    return commands.get(name)
}

function hash(body: unknown[]): string {
    return crypto.createHash('sha256').update(GUILD_ID + JSON.stringify(body)).digest('hex')
}

function savedHash(): string {
    try { return fs.readFileSync(HASH_FILE, 'utf-8').trim() } catch { return '' }
}

function saveHash(h: string) {
    const dir = path.dirname(HASH_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(HASH_FILE, h)
}

export async function deploy(force = false) {
    const body    = commands.map(c => c.slash.toJSON())
    const current = hash(body)
    const prev    = savedHash()

    if (!force && current === prev) {
        console.log(`Commands unchanged (${commands.size} commands), skipping deploy`)
        return
    }

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body })
    saveHash(current)
    console.log(`Deployed ${body.length} slash commands to guild ${GUILD_ID}`)
}
