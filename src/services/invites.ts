// love from https://yourpov.dev/

import { ChannelType, type Guild } from 'discord.js'
import * as settings from '../data/settings'

const INVITE_CODE_KEY = 'rejoin_invite_code'

export async function getInvite(guild: Guild): Promise<string | null> {
    const code = settings.get(INVITE_CODE_KEY)
    if (code && await isValid(guild, code)) return `https://discord.gg/${code}`
    return makeInvite(guild)
}

async function isValid(guild: Guild, code: string): Promise<boolean> {
    try {
        await guild.invites.fetch(code)
        return true
    } catch {
        return false
    }
}

async function makeInvite(guild: Guild): Promise<string | null> {
    const me = guild.members.me
    if (!me) return null

    const channel = guild.channels.cache.find(
        c => c.type === ChannelType.GuildText && c.permissionsFor(me).has('CreateInstantInvite'),
    )
    if (!channel || channel.type !== ChannelType.GuildText) {
        console.error('[Invite] No channel with Create Instant Invite permission found, rejoin invites are disabled')
        return null
    }

    try {
        const invite = await channel.createInvite({ maxAge: 0, maxUses: 0, unique: false })
        settings.set(INVITE_CODE_KEY, invite.code)
        return `https://discord.gg/${invite.code}`
    } catch (err) {
        console.error('[Invite] Failed to create rejoin invite:', err)
        return null
    }
}
