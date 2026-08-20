// love from https://yourpov.dev/

import type {
    Interaction,
    ChatInputCommandInteraction,
    ButtonInteraction,
    ModalSubmitInteraction,
} from 'discord.js'
import { MessageFlags } from 'discord.js'
import type { Event }   from '../types'
import { get }          from '../services/registry'
import * as embeds      from '../services/embeds'
import { hpButton, hpModal } from '../commands/honeypot'

async function guard(
    i: ChatInputCommandInteraction | ButtonInteraction | ModalSubmitInteraction,
    label: string,
    run: () => Promise<void>,
) {
    try {
        await run()
    } catch (err) {
        console.error(`${label} error:`, err)
        const reply = embeds.fail(`${label} no permissions for that channel`)
        if (i.replied || i.deferred) {
            await i.followUp({ ...reply, flags: MessageFlags.Ephemeral }).catch(() => null)
        } else {
            await i.reply({ ...reply, flags: MessageFlags.Ephemeral }).catch(() => null)
        }
    }
}

async function runCommand(i: ChatInputCommandInteraction) {
    const cmd = get(i.commandName)
    if (!cmd) return
    await cmd.run(i)
}

export const event: Event = {
    name: 'interactionCreate',
    async run(interaction: unknown) {
        const i = interaction as Interaction
        if (i.isChatInputCommand()) return guard(i, `/${i.commandName}`, () => runCommand(i))
        if (i.isButton() && i.customId.startsWith('hp:')) return guard(i, 'Honeypot button', () => hpButton(i))
        if (i.isModalSubmit() && i.customId.startsWith('hp_modal:')) return guard(i, 'Honeypot form', () => hpModal(i))
    },
}
