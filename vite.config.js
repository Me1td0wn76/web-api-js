import { defineConfig } from 'vite'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'node:crypto'

// ── ビルド時の乱数・進数変換 (Node.js 側) ──────────────
const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function nodeBigInt() {
  const buf = randomBytes(7)
  let n = 0n
  for (const b of buf) n = (n << 8n) | BigInt(b)
  return n === 0n ? 1n : n
}

function nodeToBase(n, base) {
  if (n === 0n) return { digits: [0], result: base <= 62 ? '0' : '[0]' }
  const b = BigInt(base)
  const digits = []
  let x = n
  while (x > 0n) { digits.unshift(Number(x % b)); x /= b }
  const result = base <= 62
    ? digits.map(d => CHARS[d]).join('')
    : digits.map(d => `[${d}]`).join('')
  return { digits, result }
}

function makeJsonPayload(base) {
  const decimal = nodeBigInt()
  const { digits, result } = nodeToBase(decimal, base)
  return { decimal: decimal.toString(), base, result, digits, digitCount: digits.length, generatedAt: new Date().toISOString() }
}

// ── Dev: /base/N/ → index.html にフォールバック ─────────
function devRoutingPlugin() {
  return {
    name: 'dev-base-routing',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split('?')[0]
        // /base/N.json → 動的 JSON レスポンスを返す
        const jsonMatch = path.match(/^\/base\/(\d+)\.json$/)
        if (jsonMatch) {
          const base = parseInt(jsonMatch[1], 10)
          if (base >= 2 && base <= 1023) {
            const payload = makeJsonPayload(base)
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(JSON.stringify(payload, null, 2))
            return
          }
        }
        // /base/N/ → HTML ビューア
        if (/^\/base\/\d+\/?$/.test(path)) req.url = '/'
        next()
      })
    }
  }
}

// ── Build: /base/N.json と /base/N/index.html を生成 ────
function endpointGeneratorPlugin() {
  let outDir = 'dist'

  return {
    name: 'endpoint-generator',
    configResolved(config) { outDir = config.build.outDir || 'dist' },
    async writeBundle(_options, bundle) {
      const jsFile  = Object.values(bundle).find(f => f.type === 'chunk' && f.isEntry)?.fileName
      const cssFile = Object.values(bundle).find(f => f.type === 'asset' && String(f.fileName).endsWith('.css'))?.fileName
      if (!jsFile) return

      const makeHtml = (base) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Base ${base} – Converter API</title>
<link rel="icon" href="../../favicon.svg">
${cssFile ? `<link rel="stylesheet" href="../../${cssFile}">` : ''}
</head>
<body>
<div id="app"></div>
<script type="module" src="../../${jsFile}"></script>
</body>
</html>`

      // /base/ ディレクトリを一度だけ作成
      await mkdir(join(outDir, 'base'), { recursive: true })

      const tasks = []
      for (let base = 2; base <= 1023; base++) {
        // ① JSON ファイル (application/json で返る本命エンドポイント)
        const payload = JSON.stringify(makeJsonPayload(base), null, 2)
        tasks.push(writeFile(join(outDir, 'base', `${base}.json`), payload))

        // ② HTML ビューア (ブラウザで見るとき用 — 毎回新しい乱数を生成)
        const dir = join(outDir, 'base', String(base))
        tasks.push(mkdir(dir, { recursive: true }).then(() => writeFile(join(dir, 'index.html'), makeHtml(base))))
      }
      await Promise.all(tasks)
      console.log('\x1b[32m✓\x1b[0m Generated 1022 × (JSON + HTML)  (/base/2.json … /base/1023.json)')
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [devRoutingPlugin(), endpointGeneratorPlugin()],
})
