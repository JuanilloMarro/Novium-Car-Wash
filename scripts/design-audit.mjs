// Enforces docs/lineamientos.md. Usage: node scripts/design-audit.mjs [files...]  (default: all of app/)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const ROOT = process.cwd()
const EXTENSIONS = ['.vue', '.ts']
const SKIP_DIRS = ['app/components/ui', 'app/types', 'app/assets']
// Folders allowed to compose raw text sizes and weights (they define the roles)
const BASE_DIRS = ['app/components/ui', 'app/components/app']

const PALETTE = 'gray|slate|zinc|neutral|stone|blue|sky|red|orange|yellow|lime|green|teal|cyan|indigo|violet|purple|fuchsia|pink'
const COLOR_UTILS = 'bg|text|border|ring|fill|stroke|from|via|to|outline|shadow|divide|decoration|placeholder|caret|accent'
const THEME_SIZES = 'display|page|heading|title|row|body|option|value|field|label|meta|status|micro|input'

const RULES = [
  { id: 'arbitrary-value', re: /[a-z][\w:/.-]*-\[[^\]\s]+\]/, msg: 'Valor arbitrario: usa la clase canónica o un token del tema' },
  { id: 'arbitrary-property', re: /(?<=["'`\s])\[[a-z-]+:[^\]\s'"]+\]/, msg: 'Propiedad arbitraria: declara una utilidad con nombre en el tema' },
  { id: 'hex-color', re: /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/, msg: 'Color hex: declara el color con nombre en el tema' },
  { id: 'css-color-fn', re: /\b(?:rgba?|hsla?|oklch)\(/, msg: 'Color suelto: declara el color con nombre en el tema' },
  { id: 'generic-palette', re: new RegExp(`(?<![\\w-])(?:${COLOR_UTILS})-(?:${PALETTE})-\\d`), msg: 'Paleta genérica: usa navy, o emerald / amber / rose para estados' },
  { id: 'black-color', re: new RegExp(`(?<![\\w-])(?:${COLOR_UTILS})-black\\b`), msg: 'Negro suelto: usa las tintas o navy del tema' },
  { id: 'static-style', re: /(?<![:\w-])style="/, msg: 'style estático: solo :style con valores calculados en ejecución' },
  { id: 'overlay-v-if', re: /<(?:App)?(?:Dialog|Sheet|AlertDialog|Drawer|Popover)\b[^>]*\sv-if=/, msg: 'Overlay con v-if: contrólalo con v-model:open para no cortar la salida' },
  { id: 'hover-zoom', re: /hover:scale-/, msg: 'Zoom con hover prohibido' },
  { id: 'long-dash', re: /[\u2013\u2014]/, msg: 'Guion largo: usa ":" o "," en frases y "-" en rangos' },
]

const TYPOGRAPHY_RULE = {
  id: 'raw-typography',
  re: new RegExp(`(?<![\\w-])(?:text-(?:xs|sm|base|lg|[2-9]?xl|${THEME_SIZES})|font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)|leading-[\\w.]+|tracking-\\w+|text-navy-\\d+)(?![\\w-])`),
  msg: 'Tipografía suelta: usa un rol type-* (y flow-text para lectura)',
}

const toPosix = p => p.split(sep).join('/')
const isUnder = (file, dirs) => dirs.some(d => file === d || file.startsWith(`${d}/`))

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    const rel = toPosix(relative(ROOT, full))
    if (statSync(full).isDirectory()) return isUnder(rel, SKIP_DIRS) ? [] : walk(full)
    return EXTENSIONS.some(ext => name.endsWith(ext)) ? [rel] : []
  })
}

const args = process.argv.slice(2)
const files = (args.length ? args.map(f => toPosix(relative(ROOT, resolve(ROOT, f)))) : walk(join(ROOT, 'app')))
  .filter(f => EXTENSIONS.some(ext => f.endsWith(ext)) && !isUnder(f, SKIP_DIRS))

const violations = []
for (const file of files) {
  const rules = isUnder(file, BASE_DIRS) ? RULES : [...RULES, TYPOGRAPHY_RULE]
  readFileSync(resolve(ROOT, file), 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (line.includes('design-audit-ignore')) return
    for (const rule of rules) {
      const match = line.match(rule.re)
      if (match) violations.push(`${file}:${i + 1}  [${rule.id}] ${rule.msg}  → ${match[0]}`)
    }
  })
}

if (violations.length) {
  console.error(violations.join('\n'))
  console.error(`\n✖ ${violations.length} violaciones de lineamientos en ${files.length} archivos`)
  process.exit(1)
}
console.log(`✓ design-audit: ${files.length} archivos sin violaciones`)
