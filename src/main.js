import './style.css'

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

function randomBigInt() {
  const bytes = new Uint8Array(7)
  crypto.getRandomValues(bytes)
  let n = 0n
  for (const b of bytes) n = (n << 8n) | BigInt(b)
  return n === 0n ? 1n : n
}

function toBase(n, base) {
  if (n === 0n) {
    return { digits: [0], result: base <= 62 ? '0' : '[0]' }
  }
  const b = BigInt(base)
  const digits = []
  let x = n
  while (x > 0n) {
    digits.unshift(Number(x % b))
    x /= b
  }
  const result = base <= 62
    ? digits.map(d => CHARS[d]).join('')
    : digits.map(d => `[${d}]`).join('')
  return { digits, result }
}

function makeResponse(base) {
  const decimal = randomBigInt()
  const { digits, result } = toBase(decimal, base)
  return {
    decimal: decimal.toString(),
    base,
    result,
    digits,
    digitCount: digits.length,
    generatedAt: new Date().toISOString()
  }
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlight(json) {
  return esc(json).replace(
    /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?)/g,
    match => {
      let cls = 'jn'
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'jk' : 'js'
      else if (/true|false/.test(match)) cls = 'jb'
      else if (/null/.test(match)) cls = 'jnull'
      return `<span class="${cls}">${match}</span>`
    }
  )
}

function jsonBlock(obj) {
  return `<pre class="json-block"><code>${highlight(JSON.stringify(obj, null, 2))}</code></pre>`
}

const params = new URLSearchParams(location.search)
const baseParam = params.get('base')
const app = document.getElementById('app')

if (baseParam !== null) {
  renderApiView(baseParam)
} else {
  renderDocsView()
}

function renderApiView(rawBase) {
  const base = parseInt(rawBase, 10)
  const isError = !rawBase || isNaN(base) || base < 2 || base > 1024

  const data = isError
    ? { error: 'INVALID_BASE', message: 'base は 2〜1024 の整数で指定してください', provided: rawBase }
    : makeResponse(base)

  const json = JSON.stringify(data, null, 2)

  app.innerHTML = `
    <div class="api-page">
      <div class="res-bar">
        <div class="res-bar-left">
          <span class="pill method">GET</span>
          <code class="res-url">/?base=${esc(rawBase)}</code>
        </div>
        <span class="pill ${isError ? 'err' : 'ok'}">${isError ? '400 Bad Request' : '200 OK'}</span>
      </div>
      <div class="res-body">
        <pre class="json-block" id="jout"><code>${highlight(json)}</code></pre>
      </div>
      <div class="res-footer">
        <a class="btn-link" href="./">← ドキュメントへ戻る</a>
        <div class="res-actions">
          <button class="btn" onclick="location.reload()">↻ 再生成</button>
          <button class="btn" onclick="doCopy()">コピー</button>
        </div>
      </div>
    </div>
  `
  window.doCopy = () => {
    navigator.clipboard.writeText(json)
      .then(() => alert('コピーしました'))
  }
}

function renderDocsView() {
  const exampleData = {
    decimal: '49824235094475',
    base: 16,
    result: '2d3f8a6e5b8b',
    digits: [2, 13, 3, 15, 8, 10, 6, 14, 5, 11, 8, 11],
    digitCount: 12,
    generatedAt: '2026-06-25T00:00:00.000Z'
  }

  app.innerHTML = `
    <div class="docs-page">
      <header class="site-header">
        <div class="header-inner">
          <div class="header-title">
            <span class="pill method">API</span>
            <h1>Base Converter</h1>
          </div>
          <p class="tagline">ランダムな数値を <strong>2〜1024 進数</strong> に変換する Web API</p>
          <div class="header-badges">
            <span class="badge">Static</span>
            <span class="badge">GitHub Pages</span>
            <span class="badge">No Auth Required</span>
          </div>
        </div>
      </header>

      <main class="docs-main">

        <section class="doc-section">
          <h2>エンドポイント</h2>
          <div class="endpoint-card">
            <span class="pill method">GET</span>
            <code>https://&lt;username&gt;.github.io/web-api-js/?base=<em>{base}</em></code>
          </div>
        </section>

        <section class="doc-section">
          <h2>パラメータ</h2>
          <table class="param-table">
            <thead><tr><th>名前</th><th>型</th><th>必須</th><th>説明</th><th>範囲</th></tr></thead>
            <tbody>
              <tr>
                <td><code>base</code></td>
                <td><code>integer</code></td>
                <td><span class="required">✓</span></td>
                <td>変換先の進数</td>
                <td>2 〜 1024</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="doc-section">
          <h2>レスポンス形式</h2>
          ${jsonBlock(exampleData)}
          <table class="param-table field-table">
            <thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead>
            <tbody>
              <tr><td><code>decimal</code></td><td><code>string</code></td><td>元の 10 進数値</td></tr>
              <tr><td><code>base</code></td><td><code>number</code></td><td>指定された進数</td></tr>
              <tr><td><code>result</code></td><td><code>string</code></td><td>変換結果</td></tr>
              <tr><td><code>digits</code></td><td><code>number[]</code></td><td>各桁の数値配列 (最上位桁から)</td></tr>
              <tr><td><code>digitCount</code></td><td><code>number</code></td><td>桁数</td></tr>
              <tr><td><code>generatedAt</code></td><td><code>string</code></td><td>生成日時 (ISO 8601)</td></tr>
            </tbody>
          </table>
        </section>

        <section class="doc-section">
          <h2>表現形式について</h2>
          <ul class="note-list">
            <li><strong>base ≤ 62</strong>: <code>0-9 a-z A-Z</code> の文字を使用<br>
              例 (base 16): <code class="example">1e240</code></li>
            <li><strong>base &gt; 62</strong>: 各桁を <code>[n]</code> 形式で表現<br>
              例 (base 1024): <code class="example">[1][226][64]</code></li>
            <li>乱数の範囲: <strong>1 〜 2⁵⁶</strong> (約 72 兆) — リクエストごとに異なる値を返します</li>
          </ul>
        </section>

        <section class="doc-section">
          <h2>エラーレスポンス</h2>
          ${jsonBlock({ error: 'INVALID_BASE', message: 'base は 2〜1024 の整数で指定してください', provided: 'abc' })}
        </section>

        <section class="doc-section playground-section">
          <h2>ライブデモ</h2>
          <div class="playground">
            <div class="controls">
              <label>進数を選択: <strong id="base-label">16</strong></label>
              <input type="range" id="base-slider" min="2" max="1024" value="16"
                oninput="onBaseChange(this.value)">
              <input type="number" id="base-num" min="2" max="1024" value="16"
                oninput="onBaseChange(this.value)">
            </div>
            <div class="url-row">
              <span class="pill method sm">GET</span>
              <code id="url-display">/?base=16</code>
              <a id="open-link" class="btn-link sm" href="?base=16" target="_blank">新しいタブで開く ↗</a>
            </div>
            <button class="btn primary" onclick="runDemo()">変換する</button>
            <div id="demo-out" class="demo-out"></div>
          </div>
        </section>

      </main>

      <footer class="site-footer">
        <p>Powered by <a href="https://vitejs.dev/" target="_blank" rel="noreferrer">Vite</a>
          · Deployed on <a href="https://pages.github.com/" target="_blank" rel="noreferrer">GitHub Pages</a></p>
      </footer>
    </div>
  `

  window.onBaseChange = (val) => {
    const n = Math.max(2, Math.min(1024, parseInt(val) || 2))
    document.getElementById('base-slider').value = n
    document.getElementById('base-num').value = n
    document.getElementById('base-label').textContent = n
    document.getElementById('url-display').textContent = `/?base=${n}`
    document.getElementById('open-link').href = `?base=${n}`
  }

  window.runDemo = () => {
    const base = parseInt(document.getElementById('base-num').value)
    if (isNaN(base) || base < 2 || base > 1024) return
    const data = makeResponse(base)
    document.getElementById('demo-out').innerHTML = jsonBlock(data)
  }

  runDemo()
}
