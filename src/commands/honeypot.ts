// love from https://yourpov.dev/

import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    type ButtonInteraction,
    type ModalSubmitInteraction,
    type GuildBasedChannel,
} from 'discord.js'
import type { Command } from '../types'
import { isAdmin }      from '../services/permissions'
import { COLORS }       from '../config'
import * as embeds      from '../services/embeds'
import * as settings    from '../data/settings'

function statusEmbed(): EmbedBuilder {
    const ch    = settings.get('honeypot_channel')
    const days  = settings.get('honeypot_days') || '7'
    const embed = new EmbedBuilder().setTimestamp()
    if (!ch) {
        return embed.setColor(COLORS.warn).setTitle('Honeypot').setDescription('Honeypot not setup')
    }
    return embed
        .setColor(COLORS.success)
        .setTitle('Honeypot Active')
        .addFields(
            { name: 'Channel', value: `<#${ch}>`, inline: true },
            { name: 'Ban Duration', value: `${days} days`, inline: true },
        )
}

async function postWarning(channel: GuildBasedChannel, days: number) {
    const payload      = embeds.warningNotice(days)
    const savedChannel = settings.get('notice_channel')
    const savedMessage = settings.get('notice_message')

    if (savedChannel && savedMessage) {
        try {
            const ch = await channel.client.channels.fetch(savedChannel)
            if (ch?.isTextBased() && 'messages' in ch) {
                const msg = await ch.messages.fetch(savedMessage)
                await msg.edit(payload)
                return
            }
        } catch (err) {
            console.error('[Honeypot] Could not update existing warning notice, posting a new one instead:', err)
        }
    }

    if (!channel.isTextBased() || !('send' in channel)) return
    const msg = await channel.send(payload)
    settings.set('notice_channel', channel.id)
    settings.set('notice_message', msg.id)
}

function buttons(): ActionRowBuilder<ButtonBuilder>[] {
    const ch  = settings.get('honeypot_channel')
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('hp:set')
            .setLabel(ch ? 'Change Channel' : 'Set Channel')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🪤'),
        new ButtonBuilder()
            .setCustomId('hp:clear')
            .setLabel('Disable')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔓')
            .setDisabled(!ch),
        new ButtonBuilder()
            .setCustomId('hp:refresh')
            .setLabel('Refresh')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔄'),
    )
    return [row]
}

export const command: Command = {
    slash: new SlashCommandBuilder()
        .setName('honeypot')
        .setDescription('Manage the honeypot channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async run(i) {
        if (!i.inCachedGuild()) return
        if (!isAdmin(i.member)) {
            await i.reply({ content: 'No access', flags: MessageFlags.Ephemeral })
            return
        }
        await i.deferReply({ flags: MessageFlags.Ephemeral })
        await i.editReply({ embeds: [statusEmbed()], components: buttons() })
    },
}

export async function hpButton(i: ButtonInteraction) {
    if (!i.inCachedGuild() || !isAdmin(i.member)) {
        await i.reply({ ...embeds.fail('No access'), flags: MessageFlags.Ephemeral })
        return
    }

    const [, action] = i.customId.split(':')

    if (action === 'refresh') {
        await i.deferUpdate()
        await i.editReply({ embeds: [statusEmbed()], components: buttons() })
        return
    }

    if (action === 'clear') {
        await i.deferUpdate()
        settings.set('honeypot_channel', '')
        settings.set('honeypot_days', '')
        await i.editReply({ embeds: [statusEmbed()], components: buttons() })
        await i.followUp({ ...embeds.success('Honeypot disabled'), flags: MessageFlags.Ephemeral })
        return
    }

    if (action === 'set') {
        const modal = new ModalBuilder()
            .setCustomId('hp_modal:set')
            .setTitle('Set Honeypot')
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('channel_id')
                        .setLabel('Channel ID')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('01234567789')
                        .setRequired(true)
                        .setMaxLength(20)
                ),
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('days')
                        .setLabel('Ban duration (days)')
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder('1')
                        .setRequired(false)
                        .setMaxLength(2)
                ),
            )
        await i.showModal(modal)
        return
    }
}

export async function hpModal(i: ModalSubmitInteraction) {
    if (!i.inCachedGuild() || !isAdmin(i.member)) {
        await i.reply({ ...embeds.fail('No access.'), flags: MessageFlags.Ephemeral })
        return
    }

    await i.deferUpdate()
    const channelId = i.fields.getTextInputValue('channel_id').trim()
    const daysStr   = i.fields.getTextInputValue('days').trim()
    const days      = parseInt(daysStr || '7', 10)

    if (!/^\d{17,20}$/.test(channelId)) {
        return void await i.followUp({ ...embeds.fail('Invalid channel ID'), flags: MessageFlags.Ephemeral })
    }

    const channel = await i.guild!.channels.fetch(channelId).catch(() => null)
    if (!channel) {
        return void await i.followUp({ ...embeds.fail('Channel not found in this server'), flags: MessageFlags.Ephemeral })
    }

    if (isNaN(days) || days < 1 || days > 30) {
        return void await i.followUp({ ...embeds.fail('Days must be 1-30'), flags: MessageFlags.Ephemeral })
    }

    settings.set('honeypot_channel', channelId)
    settings.set('honeypot_days', String(days))

    let noticeFailed = false
    try {
        await postWarning(channel, days)
    } catch (err) {
        noticeFailed = true
        console.error('[Honeypot] Failed to post warning notice:', err)
    }

    await i.editReply({ embeds: [statusEmbed()], components: buttons() })
    const note = noticeFailed ? ' Warning notice failed to post, make sure the bot has Send Messages + Embed Links there.' : ''
    await i.followUp({ ...embeds.success(`Honeypot set to <#${channelId}>, ${days}-day ban.${note}`), flags: MessageFlags.Ephemeral })
}
