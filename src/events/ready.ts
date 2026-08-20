// love from https://yourpov.dev/

import type { Client }  from 'discord.js'
import type { Event }   from '../types'
import { load, deploy } from '../services/registry'
import { migrate }      from '../data/db'
import * as bans        from '../data/bans'
import path             from 'path'

const BAN_CHECK_INTERVAL = 60_000

function cleanExpiredBans(client: Client<true>) {
    try {
        for (const ban of bans.expired()) {
            const guild = client.guilds.cache.get(ban.guild_id)
            if (guild) guild.bans.remove(ban.user_id, 'Honeypot temp-ban expired').catch(() => {})
            bans.remove(ban.user_id)
        }
    } catch (err) {
        console.error('Failed to sweep expired bans:', err)
    }
}

export const event: Event = {
    name: 'clientReady',
    once: true,
    async run(client: unknown) {
        const c = client as Client<true>
        console.log(`Hosting ${c.user.tag}`)
        try { migrate() } catch (err) { console.error('Migration error:', err) }
        load(path.join(__dirname, '..', 'commands'))
        try {
            await deploy()
        } catch (err) {
            console.error('Failed to deploy commands, they will stay unregistered until the bot restarts:', err)
        }
        cleanExpiredBans(c)
        setInterval(() => cleanExpiredBans(c), BAN_CHECK_INTERVAL)
        console.log('Ready.')
    },
}
