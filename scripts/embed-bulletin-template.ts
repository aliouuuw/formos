/**
 * Embeds the Bulletin de souscription template PDF as a base64 TS module so the
 * server can fill it at runtime without depending on filesystem/bundler layout.
 *
 * Run: bun run scripts/embed-bulletin-template.ts
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(root, 'public/campaign/bulletin-souscription-ipo-bridge-bank-template.pdf')
const OUT = join(root, 'src/lib/pdf/bulletin-template.base64.ts')

const bytes = await readFile(SRC)
const base64 = bytes.toString('base64')
const contents = `// AUTO-GENERATED. Source: public/campaign/bulletin-souscription-ipo-bridge-bank-template.pdf
// Regenerate: bun run scripts/embed-bulletin-template.ts
export const BULLETIN_TEMPLATE_BASE64 =
  ${JSON.stringify(base64)}
`
await writeFile(OUT, contents)
console.log(`[embed] Wrote ${OUT} (${base64.length} base64 chars)`)
