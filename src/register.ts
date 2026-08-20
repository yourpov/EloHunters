// love from https://yourpov.dev/

import path              from 'path'
import { load, deploy }  from './services/registry'

const force   = process.argv.includes('--force')
const timeout = setTimeout(() => { console.error('Register timed out after 30s'); process.exit(1) }, 30_000)

console.log(`[register] loading commands...${force ? ' (forced)' : ''}`)
load(path.join(__dirname, 'commands'))
deploy(force)
    .then(() => { clearTimeout(timeout); console.log('[register] done'); setTimeout(() => process.exit(0), 0) })
    .catch((e) => { clearTimeout(timeout); console.error('[register] failed:', e); setTimeout(() => process.exit(1), 0) })
