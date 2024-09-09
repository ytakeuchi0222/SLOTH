


# 1.事前準備

## 1-1.XのデベロッパーサイトでAPIキーやトークンなどの発行
https://developer.x.com/en/portal/dashboard

## 1-2.コールバックURLの設定
```
https://script.google.com/macros/d/{スクリプトID}/usercallback
```

# 2.使用方法
## 2-1.ライブラリの読み込み

```
10-3mPLjKMCEfMJEPFroTPRYpBU6RDIlBPY0qDBIIF46w55emFpOYp4vf
```
## 2-2.XのAPIで使用する設定ファイルの作成・と必要情報の設定

```javascript
const CLIENT_ID = 'XXXXXXXXXX';
const CLIENT_SECRET = 'XXXXXXXXXX';
const API_KEY = 'XXXXXXXXXX';
const API_KEY_SECRET = 'XXXXXXXXXX';
const ACCESS_TOKEN = 'XXXXXXXXXX';
const ACCESS_TOKEN_SECRET = 'XXXXXXXXXX';
const BearerTOKEN = 'XXXXXXXXXX';

//プロパティセット
SLOTH.setUserProperty(CLIENT_ID,CLIENT_SECRET,API_KEY,API_KEY_SECRET,ACCESS_TOKEN,ACCESS_TOKEN_SECRET,BearerTOKEN);

//X認証
function auth(){
  SLOTH.main();
}

//X認証用のコールバック
function authCallback(request) {
    var service = SLOTH.getService();
    var authorized = service.handleCallback(request);
    if (authorized) {
        return HtmlService.createHtmlOutput('Success!');
    }
    else {
        return HtmlService.createHtmlOutput('Denied.');
    }
}
```
## 2-3.authを実行して認証

```javascript
function auth(){
  SLOTH.main();
}

```