// love from https://yourpov.dev/

import {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType,
} from 'discord.js'
import type { Command } from '../types'
import { isAdmin } from '../services/permissions'
import { COLORS } from '../config'
import * as embeds from '../services/embeds'

const RULES: { title: string; description: string; punishment: string }[] = [
    { title: '1. No Spamming', description: "Don't spam messages or images in any channel. Doing so results in a 5 minute timeout.", punishment: '🔇 Mute' },
    { title: '2. Respect', description: 'Interact with all members respectfully and courteously. Personal attacks, trolling, or harassment are not permitted.', punishment: '⚠️ Warn' },
    { title: '3. Follow Discord TOS', description: "Avoid discussions or activities that violate Discord's Terms of Service, this includes sharing pirated content, copyright infringement, promoting cheats, and other harmful activity.", punishment: '🚫 Ban' },
    { title: '4. No Sensitive Topics', description: 'Refrain from discussing polarizing subjects like politics, religion, or personal issues that may cause discomfort.', punishment: '🔇 Mute' },
    { title: '5. No Impersonation', description: 'Do not impersonate staff, members, or any other individuals.', punishment: '🚫 Ban' },
    { title: '6. Stay On Topic', description: "Keep conversations relevant to the channel's subject. Off-topic discussions may be moved or removed.", punishment: '⚠️ Warn' },
    { title: '7. No NSFW', description: 'Posting or sharing NSFW content will get you banned.', punishment: '🚫 Ban' },
    { title: '8. Ticket Procedures', description: 'Do not ask management to check your ticket. All tickets are addressed when management is available.', punishment: '⚠️ Warn' },
    { title: '9. No Doxxing', description: "Taking screenshots or sharing private information from members' chats will result in an immediate ban.", punishment: '🚫 Ban' },
]

function rulesEmbed(): EmbedBuilder {
    const embed = embeds.base(COLORS.brand).setTitle('Server Rules')
    for (const rule of RULES) {
        embed.addFields({ name: rule.title, value: `${rule.description}\nPunishment: ${rule.punishment}` })
    }
    return embed
}

export const command: Command = {
    slash: new SlashCommandBuilder()
        .setName('rules')
        .setDescription('Post the server rules in a channel')
        .addChannelOption(o => o
            .setName('channel')
            .setDescription('Channel to post the rules in')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async run(i) {
        if (!i.inCachedGuild()) return
        if (!isAdmin(i.member)) {
            await i.reply({ ...embeds.fail('No access'), flags: MessageFlags.Ephemeral })
            return
        }

        const channel = i.options.getChannel('channel', true, [ChannelType.GuildText])
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        try {
            await channel.send({ embeds: [rulesEmbed()] })
        } catch (err) {
            console.error('[Rules] Failed to post rules:', err)
            await i.editReply(embeds.fail(`Couldn't post in <#${channel.id}>, make sure the bot has Send Messages + Embed Links there.`))
            return
        }

        await i.editReply(embeds.success(`Rules posted in <#${channel.id}>.`))
    },
}
