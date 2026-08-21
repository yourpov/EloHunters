# EloHunters

discord EloHunters discord bot
<img width="662" height="353" alt="image" src="https://github.com/user-attachments/assets/68164228-6d01-4466-83b3-f3e09ff40481" />

## setup

```env
TOKEN=
CLIENT_ID=
GUILD_ID=
ADMIN_ROLE_ID=
```

```bash
npm install; npm run register; npm run dev
```

`ADMIN_ROLE_ID` is optional, skip it and only members with `Administrator` can touch the commands below.

## commands

### admin (Manage Guild)

| command | description |
|---------|-------------|
| /honeypot | set the trap channel and ban length, disable it, or refresh the status |
| /rules    | sends server rules embed |
| /product  | post or update a named product embed. optional image/video upload or video link, thumbnail, and a link button. auto-pings @everyone (spoilered) |

## how it works

- setting or changing the trap channel auto-posts a fixed warning notice there (re-setting it just updates that same message instead of spamming a new one)
- post a message in the trap channel = instant delete + ban, no warnings
- right before the ban, the bot DMs the user a rejoin invite (same invite gets reused every time, not spammed out fresh)
- bans get stored with an expiry, checked every 60 seconds, and lifted automatically once the time's up

## required bot permissions

| permission | used by |
|------------|---------|
| Send Messages | all replies/embeds |
| Embed Links | all embeds |
| View Channel | watching the trap channel |
| Manage Messages | deleting trap channel messages |
| Ban Members | the ban itself + auto-unban sweep |
| Create Instant Invite | the rejoin invite |

---

## support & contact

* https://yourpov.dev/
