


# 1.事前準備

## 1-1.XのデベロッパーサイトでAPIキーやトークンなどの発行
https://developer.x.com/en/portal/dashboard

## 1-2.コールバックURLの設定
```
https://script.google.com/macros/d/{スクリプトID}/usercallback
```

# 2.設定方法
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

# 使用方法
## テキスト投稿
```javascirpt
SLOTH.send_text_Tweet(content);
```
## 画像投稿
```javascirpt
SLOTH.send_image_Tweet(image_url, content);
```
## 動画投稿
```javascirpt
SLOTH.send_video_Tweet(video_url, content);
```
## テキストでのツリー投稿
```javascirpt
SLOTH.tree_send_text_Tweet(tw_id, content);
```

# 注意事項
* 無料版の投稿上限は1500回/月(48回/日)まで
* 再生時間は0.5秒～140秒の間としてください
* フレームレートは60FPS以下としてください
* サイズは32x32～1280x1024の間としてください
* 動画のURLはmp4形式で指定してください(例 https://xxx.co.jp//xxx/xxx.mp4)
