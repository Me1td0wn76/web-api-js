import { defineConfig } from 'vite'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

// Dev: /base/N/ をメインの index.html にフォールバック
function devRoutingPlugin() {
  return {
    name: 'dev-base-routing',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (/^\/base\/\d+\/?$/.test(req.url.split('?')[0])) {
          req.url = '/'
        }
        next()
      })
    }
  }
}

// Build: /base/2/ 〜 /base/1023/ の 1022 個の HTML を生成
function endpointGeneratorPlugin() {
  let outDir = 'dist'

  return {
    name: 'endpoint-generator',
    configResolved(config) {
      outDir = config.build.outDir || 'dist'
    },
    async writeBundle(_options, bundle) {
      const jsFile = Object.values(bundle)
        .find(f => f.type === 'chunk' && f.isEntry)?.fileName
      const cssFile = Object.values(bundle)
        .find(f => f.type === 'asset' && String(f.fileName).endsWith('.css'))?.fileName

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

      const tasks = []
      for (let base = 2; base <= 1023; base++) {
        const dir = join(outDir, 'base', String(base))
        const html = makeHtml(base)
        tasks.push(mkdir(dir, { recursive: true }).then(() => writeFile(join(dir, 'index.html'), html)))
      }
      await Promise.all(tasks)
      console.log('\x1b[32m✓\x1b[0m Generated 1022 endpoint pages  (/base/2/ → /base/1023/)')
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [devRoutingPlugin(), endpointGeneratorPlugin()],
})
