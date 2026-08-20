// love from https://yourpov.dev/

import 'dotenv/config'

function required(name: string): string {
    const value = process.env[name]
    if (!value) throw new Error(`Missing required env var: ${name}`)
    return value
}

function optional(name: string, fallback: string): string {
    return process.env[name] ?? fallback
}

export const TOKEN         = required('TOKEN')
export const CLIENT_ID     = required('CLIENT_ID')
export const GUILD_ID      = required('GUILD_ID')
export const ADMIN_ROLE_ID = optional('ADMIN_ROLE_ID', '')

export const COLORS = {
    brand  : 0x7c3aed,
    success: 0x57f287,
    error  : 0xed4245,
    warn   : 0xfee75c,
} as const
