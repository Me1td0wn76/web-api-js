# WEB-API-JS

JavaScript のみで作成した、**1,022 個のエンドポイント**を持つ静的 Web API です。  
ランダムな数値を 2〜1023 進数に変換して JSON で返します。  
GitHub Pages にデプロイされており、認証不要で利用できます。

---

## エンドポイント

```http
GET https://me1td0wn76.github.io/web-api-js/base/{base}.json
```

|名前|型|必須|説明|範囲|
|---|---|---|---|---|
|base|integer|✓|変換先の進数 (URL パス)|2 〜 1023|

**Content-Type:** `application/json`

---

## レスポンス例

```http
GET https://me1td0wn76.github.io/web-api-js/base/16.json
```

```json
{
  "decimal": "49824235094475",
  "base": 16,
  "result": "2d3f8a6e5b8b",
  "digits": [2, 13, 3, 15, 8, 10, 6, 14, 5, 11, 8, 11],
  "digitCount": 12,
  "generatedAt": "2026-06-25T00:00:00.000Z"
}
```

|フィールド|型|説明|
|---|---|---|
|decimal|string|元の 10 進数値|
|base|number|指定された進数|
|result|string|変換結果|
|digits|number[]|各桁の数値配列 (最上位桁から)|
|digitCount|number|桁数|
|generatedAt|string|生成日時 (ISO 8601)|

---

## 利用例

```bash
curl https://me1td0wn76.github.io/web-api-js/base/2.json
curl https://me1td0wn76.github.io/web-api-js/base/16.json
curl https://me1td0wn76.github.io/web-api-js/base/1000.json
```

```javascript
const res = await fetch('https://me1td0wn76.github.io/web-api-js/base/16.json')
const data = await res.json()
console.log(data.result) // "912aa47c018bb8"
```

---

## result フィールドの表現形式

|条件|形式|例|
|---|---|---|
|base ≤ 62|`0-9 a-z A-Z` の文字列|`1e240`|
|base > 62|`[n]` 形式|`[1][226][64]`|

---

## 仕様・制限事項

- **乱数の範囲:** 1 〜 2⁵⁶ (約 72 兆)
- **乱数の更新タイミング:** デプロイ時に確定します。リクエストごとには変わりません。
- **エンドポイント数:** 1,022 個 (`/base/2.json` 〜 `/base/1023.json`)
- **ホスティング:** GitHub Pages (静的ファイル配信)
- **ドキュメント:** [https://me1td0wn76.github.io/web-api-js/](https://me1td0wn76.github.io/web-api-js/)

---

## 技術スタック

- [Vite](https://vitejs.dev/) — バンドル・ビルド
- GitHub Pages — ホスティング
- GitHub Actions — CI/CD (main ブランチへの push で自動デプロイ)
