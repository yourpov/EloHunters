// love from https://yourpov.dev/

import type { GuildMember } from 'discord.js'
import { ADMIN_ROLE_ID }    from '../config'

export function isAdmin(member: GuildMember): boolean {
    if (member.permissions.has('Administrator')) return true
    return ADMIN_ROLE_ID !== '' && member.roles.cache.has(ADMIN_ROLE_ID)
}
