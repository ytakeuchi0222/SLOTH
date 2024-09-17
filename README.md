# SLOTH

XのAPIを使用した投稿処理をサポートするGASライブラリです。<br>
導入する事でシンプルな記述でXへの投稿処理を実装することができます。

## 使用イメージ

### テキスト投稿

```javascript
let tw_id = SLOTH.postText("投稿したいテキスト");
```

### 画像投稿

```javascript
let tw_id = SLOTH.postImage("投稿したいテキスト","投稿したい画像のURL");
```

### 動画投稿

```javascript
let tw_id = SLOTH.postVideo("投稿したいテキスト","投稿したい動画のURL");
```

### ツリー投稿

引数の末尾に投稿元のポストidを加える事でツリー投稿に対応できます

```javascript
let tw_id = SLOTH.postImage("投稿したいテキスト","投稿したい画像のURL");//元となる投稿
let tree_id = SLOTH.postText("投稿したいテキスト",tw_id);//ツリー投稿
```

## 導入方法

### GASでライブラリの読み込み

下記スクリプトIDで検索してライブラリを読み

```text
10-3mPLjKMCEfMJEPFroTPRYpBU6RDIlBPY0qDBIIF46w55emFpOYp4vf
```

![ライブラリ読み込み画面](https://drive.google.com/uc?export=view&id=1wJ6YW2K9iCq8k2_xGYd4Cas6F1aBXfKB)


### GASでスクリプトプロパティに値を設定

Xの[Developer Portal](https://developer.twitter.com/en/portal/dashboard)で各種7つの値を取得し、下記プロパティ名でスクリプトプロパティに設定

* CLIENT_ID
* CLIENT_SECRET
* API_KEY
* API_KEY_SECRET
* ACCESS_TOKEN
* ACCESS_TOKEN_SECRET
* BearerTOKEN
  
![スクリプト設定画面](https://drive.google.com/uc?export=view&id=16065va-wU8_Vi6LTkaY8aihTqGd_6ihK)

### コールバックURLの設定

[Developer Portal](https://developer.twitter.com/en/portal/dashboard)の「User authentication settings」でコールバックURLを設定

```text
https://script.google.com/macros/d/{スクリプトID}/usercallback
```

![コールバック設定画面](https://drive.google.com/uc?export=view&id=1Os_R390cV4rDRnshlB_L2W8j4nYZ3etr)

### アプリ認証用のURL生成

GASに下記コードを追加し、`setting()`を実行するとログに認証用のURLが表示されます

```javascript
const setting =()=>{const data = PropertiesService.getScriptProperties().getProperties();SLOTH.setting(data);SLOTH.main();}
const authCallback=(request)=>{return SLOTH.authCallback(request);}
```

ログに表示されたURLにアクセスするとアプリ認証画面に遷移します

![アプリ認証画面](https://drive.google.com/uc?export=view&id=1zQ533B4XLFVKNjHuslE9dqcG-KcmgkSg)

「アプリにアクセスを許可」ボタンを押して下記の画面が表示されれば設定完了です

![成功画面](https://drive.google.com/uc?export=view&id=1oHK7YGEDvRABW1_oLC8xZl__h2HxwmvV)

## 注意事項

* 無料版の投稿上限は1500回/月(48回/日)まで
* 動画の再生時間は0.5秒～140秒の間
* 動画のフレームレートは60FPS以下
* 動画のサイズは32x32～1280x1024の間
* 動画のURLはmp4形式で指定
* 複数画像を指定する際は画像URLを配列で渡す必要があります
* 画像URLが5つ以上の場合は4枚毎にツリー投稿で処理されます