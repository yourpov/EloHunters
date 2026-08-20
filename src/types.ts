// love from https://yourpov.dev/

import type {
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    ChatInputCommandInteraction,
} from 'discord.js'

export interface Command {
    slash:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
    run: (i: ChatInputCommandInteraction) => Promise<void>
}

export interface Event {
    name : string
    once?: boolean
    run  : (...args: unknown[]) => Promise<void> | void
}

export type EmbedStyle = 'default' | 'success' | 'error' | 'warn'
