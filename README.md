# 2.設定方法
## GASでライブラリの読み込み

```
10-3mPLjKMCEfMJEPFroTPRYpBU6RDIlBPY0qDBIIF46w55emFpOYp4vf
```
## GASでスクリプトプロパティに値を設定

* CLIENT_ID
* CLIENT_SECRET
* API_KEY
* API_KEY_SECRET
* ACCESS_TOKEN
* ACCESS_TOKEN_SECRET
* BearerTOKEN

## Xのアプリ側でコールバックURLの設定
```
https://script.google.com/macros/d/{スクリプトID}/usercallback
```

## アプリ認証用のURL生成
GASに下記2行を追加し、setting()を実行するとログに認証用のURLが表示されます
```javascript
const setting =()=>{const data = PropertiesService.getScriptProperties().getProperties();SLOTH.setting(data);SLOTH.main();}
const authCallback=(request)=>{return SLOTH.authCallback(request);}
```



# ライブラリの主な使用方法
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
