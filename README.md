# SLOTH
xのAPIを使用して投稿するGASライブラリ

## バージョン情報
### V7 (2024/09/13)
・画像を複数枚指定できるようになりました（4枚まで）
### V8 (2024/09/14)
・画像を複数枚指定できるようになりました
・ツリー投稿で画像が指定できるようになりました

## 設定方法
### GASでライブラリの読み込み

```
10-3mPLjKMCEfMJEPFroTPRYpBU6RDIlBPY0qDBIIF46w55emFpOYp4vf
```
### GASでスクリプトプロパティに値を設定

* CLIENT_ID
* CLIENT_SECRET
* API_KEY
* API_KEY_SECRET
* ACCESS_TOKEN
* ACCESS_TOKEN_SECRET
* BearerTOKEN

### Xのアプリ側でコールバックURLの設定
```
https://script.google.com/macros/d/{スクリプトID}/usercallback
```

### アプリ認証用のURL生成
GASに下記2行を追加し、setting()を実行するとログに認証用のURLが表示されます
```javascript
const setting =()=>{const data = PropertiesService.getScriptProperties().getProperties();SLOTH.setting(data);SLOTH.main();}
const authCallback=(request)=>{return SLOTH.authCallback(request);}
```



## ライブラリの主な使用方法
### テキスト投稿
```javascirpt
SLOTH.postText(content);
```
### 画像投稿
```javascirpt
SLOTH.postImage(image_url, content);
```
### 動画投稿
```javascirpt
SLOTH.postVideo(video_url, content);
```
### ツリー投稿
上記の関数に元の投稿のidを渡すことで対応できます
ex）テキストの場合
```javascirpt
SLOTH.postText(content,post_id);
```
ex）画像の場合
```javascirpt
SLOTH.postImage(image_url, content);
```

## 注意事項
* 無料版の投稿上限は1500回/月(48回/日)まで
* 動画の再生時間は0.5秒～140秒の間
* 動画のフレームレートは60FPS以下
* 動画のサイズは32x32～1280x1024の間
* 動画のURLはmp4形式で指定

