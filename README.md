# WEB-API-JS
JavaScriptのみで作成をした、1022個のAPIを持ったWEBAPIです。  
これはランダムな数字を2~1023進数に変換して出力をするようなAPIです。

# 仕様について  

エンドポイント 
GET https://me1td0wn76.github.io/web-api-js/base/{base}/

パラメータ
|名前|型|必須|説明|範囲|
|---|---|---|---|---|
|base|int|必須|変換する進数|2~1023|

レスポンス形式

```json
{
  "decimal": "49824235094475",
  "base": 16,
  "result": "2d3f8a6e5b8b",
  "digits": [
    2,
    13,
    3,
    15,
    8,
    10,
    6,
    14,
    5,
    11,
    8,
    11
  ],
  "digitCount": 12,
  "generatedAt": "2026-06-25T00:00:00.000Z"
}
```

|field|type|description|
|---|---|---|
|decimal|string|元の10進数の値|
|base|number|指定された進数|
|result|string|変換結果|
|digits|number[]|各桁の数値配列 (最上位桁から)|
|digitCount|number|桁数|
|generatedAt|string|生成日時 (ISO 8601)|