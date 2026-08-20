// love from https://yourpov.dev/

import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextChannel,
    PermissionFlagsBits,
    MessageFlags,
    type ModalSubmitInteraction,
} from 'discord.js'
import type { Command } from '../types'
import { isAdmin }      from '../services/permissions'
import * as embeds      from '../services/embeds'
import * as settings    from '../data/settings'

interface Media { url: string; isVideo: boolean }
interface Link { label: string; url: string }
interface Pending { media?: Media; thumbnailUrl?: string; link?: Link }

export const pendingExtras = new Map<string, Pending>()

function buildPayload(name: string, content: string, pending: Pending | undefined) {
    const embed         = embeds.productEmbed(name, content, pending?.media, pending?.thumbnailUrl)
    const messageContent = pending?.media?.isVideo ? `||@everyone||\n${pending.media.url}` : '||@everyone||'
    const components      = pending?.link
        ? [new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel(pending.link.label).setURL(pending.link.url)
        )]
        : []
    return { content: messageContent, embeds: [embed], components }
}

export const command: Command = {
    slash: new SlashCommandBuilder()
        .setName('product')
        .setDescription('Post or update a product embed in this channel')
        .addStringOption(o => o.setName('name').setDescription('Product name').setRequired(true))
        .addAttachmentOption(o => o.setName('media').setDescription('Image or video for the embed'))
        .addStringOption(o => o.setName('video').setDescription('Video link instead of an upload'))
        .addAttachmentOption(o => o.setName('thumbnail').setDescription('Small thumbnail image'))
        .addStringOption(o => o.setName('link_label').setDescription('Button text for an optional link button'))
        .addStringOption(o => o.setName('link_url').setDescription('URL for the optional link button'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async run(i) {
        if (!i.inCachedGuild()) return
        if (!isAdmin(i.member)) {
            await i.reply({ ...embeds.fail('No access'), flags: MessageFlags.Ephemeral })
            return
        }

        const name       = i.options.getString('name', true).trim()
        const attachment = i.options.getAttachment('media')
        const videoLink  = i.options.getString('video')?.trim()
        const thumbnail  = i.options.getAttachment('thumbnail')
        const linkLabel  = i.options.getString('link_label')?.trim()
        const linkUrl    = i.options.getString('link_url')?.trim()
        const key        = name.toLowerCase().replace(/\s+/g, '-')

        if (attachment && videoLink) {
            await i.reply({ ...embeds.fail('Use either media or a video link, not both'), flags: MessageFlags.Ephemeral })
            return
        }
        if ((linkLabel && !linkUrl) || (linkUrl && !linkLabel)) {
            await i.reply({ ...embeds.fail('A link button needs both a label and a URL'), flags: MessageFlags.Ephemeral })
            return
        }

        const pending: Pending = {}
        if (attachment) {
            pending.media = { url: attachment.url, isVideo: attachment.contentType?.startsWith('video/') ?? false }
        } else if (videoLink) {
            pending.media = { url: videoLink, isVideo: true }
        }
        if (thumbnail) pending.thumbnailUrl = thumbnail.url
        if (linkLabel && linkUrl) pending.link = { label: linkLabel, url: linkUrl }

        if (pending.media || pending.thumbnailUrl || pending.link) {
            const pendingKey = `${i.user.id}:${key}`
            pendingExtras.set(pendingKey, pending)
            setTimeout(() => pendingExtras.delete(pendingKey), 300_000)
        }

        const modal = new ModalBuilder()
            .setCustomId(`product_modal:${(i.channel as TextChannel).id}:${key}:${name}`)
            .setTitle(name)
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>().addComponents(
                    new TextInputBuilder()
                        .setCustomId('content')
                        .setLabel('Content (supports markdown)')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                )
            )
        await i.showModal(modal)
    },
}

export async function productModal(i: ModalSubmitInteraction) {
    if (!i.inCachedGuild()) return
    const colon               = i.customId.indexOf(':')
    const arg                 = i.customId.slice(colon + 1)
    const [channelId, key, ...nameParts] = arg.split(':')
    const name                = nameParts.join(':') || key
    const content              = i.fields.getTextInputValue('content')

    const pendingKey = `${i.user.id}:${key}`
    const pending    = pendingExtras.get(pendingKey)
    pendingExtras.delete(pendingKey)

    const payload = buildPayload(name, content, pending)

    const savedChannel = settings.get(`product_${key}_channel`)
    const savedMessage = settings.get(`product_${key}_message`)

    if (savedChannel && savedMessage) {
        try {
            const ch = await i.client.channels.fetch(savedChannel)
            if (ch?.isTextBased() && 'messages' in ch) {
                const msg = await ch.messages.fetch(savedMessage)
                await msg.edit(payload)
                await i.reply({ ...embeds.success(`${name} updated in <#${savedChannel}>.`), flags: MessageFlags.Ephemeral })
                return
            }
        } catch (err) {
            console.error(`[Product] Could not update existing "${key}" message, posting a new one instead:`, err)
        }
    }

    const channel = i.guild.channels.cache.get(channelId)
    if (!channel?.isTextBased()) {
        await i.reply({ ...embeds.fail('Channel not found'), flags: MessageFlags.Ephemeral })
        return
    }
    const msg = await (channel as TextChannel).send(payload)
    settings.set(`product_${key}_channel`, channel.id)
    settings.set(`product_${key}_message`, msg.id)
    await i.reply({ ...embeds.success(`${name} posted in <#${channel.id}>.`), flags: MessageFlags.Ephemeral })
}
