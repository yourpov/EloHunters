// love from https://yourpov.dev/

import { EmbedBuilder } from 'discord.js'
import { COLORS }       from '../config'
import type { EmbedStyle } from '../types'

const footer = { text: 'EloHunters', iconURL: 'https://imgur.com/keLrzhq.png' }

const styleColors: Record<EmbedStyle, number> = {
    default: COLORS.brand,
    success: COLORS.success,
    error  : COLORS.error,
    warn   : COLORS.warn,
}

export function base(color: number = COLORS.brand): EmbedBuilder {
    return new EmbedBuilder().setColor(color).setFooter(footer).setTimestamp()
}

export function titled(style: EmbedStyle, title: string, desc: string): EmbedBuilder {
    return base(styleColors[style]).setTitle(title).setDescription(desc)
}

export function warningNotice(days: number) {
    const embed = base(COLORS.warn).setTitle('Warning').setDescription(
        '⚠️ **DO NOT SEND ANY MESSAGES HERE**\n\n'
        + 'This channel is a **security trap** to catch compromised accounts.\n\n'
        + 'Hacked accounts often spam fake giveaway or scam links across every channel they can access.\n\n'
        + `**Any message sent here will result in an automatic ${days}-day ban.**\n\n`
        + 'If you were banned from this channel, your account was likely hacked. Change your password and enable 2FA, then contact staff to appeal.'
    )
    return { embeds: [embed] }
}

export function productEmbed(title: string, content: string, media?: { url: string; isVideo: boolean }, thumbnailUrl?: string): EmbedBuilder {
    const embed = base(COLORS.brand).setTitle(title).setDescription(content)
    if (thumbnailUrl) embed.setThumbnail(thumbnailUrl)
    if (media && !media.isVideo) embed.setImage(media.url)
    return embed
}

export function success(msg: string) {
    return { embeds: [base(COLORS.success).setDescription(`✅ ${msg}`)] }
}

export function fail(msg: string) {
    return { embeds: [base(COLORS.error).setDescription(`❌ ${msg}`)] }
}
