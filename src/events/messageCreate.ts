// love from https://yourpov.dev/

import type { Message } from 'discord.js'
import type { Event } from '../types'
import * as settings from '../data/settings'
import * as bans from '../data/bans'
import { getInvite } from '../services/invites'

const MS_PER_DAY = 86_400_000

async function notifyBanned(msg: Message<true>, days: number) {
    const invite = await getInvite(msg.guild)
    if (!invite) return
    const notice = `You were banned from **${msg.guild.name}** for posting in a monitored channel `
        + `If your account was compromised, secure it (change password and setup 2FA) and contact staff to appeal this ban `
        + `Once your ${days}-day ban expires, use this invite to rejoin: ${invite}`
    await msg.author.send(notice).catch(() => { })
}

export const event: Event = {
    name: 'messageCreate',
    async run(raw: unknown) {
        const msg = raw as Message
        if (msg.author.bot || !msg.guild || !msg.member) return

        try {
            const trapChannel = settings.get('honeypot_channel')
            if (!trapChannel || msg.channelId !== trapChannel) return

            const days = parseInt(settings.get('honeypot_days') || '7', 10)

            await msg.delete().catch(() => { })
            await notifyBanned(msg as Message<true>, days)

            await msg.member.ban({
                deleteMessageSeconds: 0,
                reason: `Honeypot: sent message in #${msg.channel.id}`,
            })

            bans.add(msg.author.id, msg.guild.id, new Date(Date.now() + days * MS_PER_DAY))

            console.log(`[Honeypot] Banned ${msg.author.tag} (${msg.author.id}) for ${days}d`)
        } catch (err) {
            console.error(`[Honeypot] Failed to process message from ${msg.author.tag}:`, err)
        }
    },
}
