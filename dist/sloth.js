
/**
* @title SLOTH
* @description APIを使用したXへの投稿機能(テキスト、画像、動画、ツリー投稿に対応
* @auther ytakeuchi
*/

// ------------------------------------------------ユーザー設定
const UP = PropertiesService.getUserProperties();
const CLIENT_ID = UP.getProperty('CLIENT_ID')
const CLIENT_SECRET = UP.getProperty("CLIENT_SECRET")
const API_KEY = UP.getProperty("API_KEY")
const API_KEY_SECRET = UP.getProperty("API_KEY_SECRET")
const ACCESS_TOKEN = UP.getProperty("ACCESS_TOKEN")
const ACCESS_TOKEN_SECRET = UP.getProperty("ACCESS_TOKEN_SECRET")
const BearerTOKEN = UP.getProperty("BearerTOKEN")
//設定した全プロパティを確認する
function propertiesCheck() {
    const data = UP.getProperties();
    for (var key in data) {
        Logger.log('キー: %s, 値: %s', key, data[key]);
    }
}
//設定した全プロパティを一括削除する
function deleteAllProperties() {
    UP.deleteAllProperties();
}
//プロパティを受け取って設定
function setting(data) {
    for (var key in data) {
        //Logger.log('キー: %s, 値: %s', key, data[key]);
        UP.setProperty(key, data[key]);
    }
}
//authorizationのリセット
function reset() {
    var service = getService(); service.reset();
}
// ------------------------------------------------Xの認証
//OAuth2.0 Service
function getService() {
    pkceChallengeVerifier();
    var userProps = PropertiesService.getUserProperties();
    var scriptProps = PropertiesService.getScriptProperties();
    return OAuth2.createService('twitter')
        .setAuthorizationBaseUrl('https://twitter.com/i/oauth2/authorize')
        .setTokenUrl('https://api.twitter.com/2/oauth2/token?code_verifier=' + userProps.getProperty("code_verifier"))
        .setClientId(CLIENT_ID)
        .setClientSecret(CLIENT_SECRET)
        .setCallbackFunction('authCallback')
        .setPropertyStore(userProps)
        .setScope('users.read tweet.read tweet.write offline.access')
        .setParam('response_type', 'code')
        .setParam('code_challenge_method', 'S256')
        .setParam('code_challenge', userProps.getProperty("code_challenge"))
        .setTokenHeaders({
            'Authorization': 'Basic ' + Utilities.base64Encode(CLIENT_ID + ':' + CLIENT_SECRET),
            'Content-Type': 'application/x-www-form-urlencoded'
        });
}
//OAuth1.0 Service
function getService1() {
    return OAuth1.createService("Twitter")
        .setAccessTokenUrl("https://api.twitter.com/oauth/access_token")
        .setRequestTokenUrl("https://api.twitter.com/oauth/request_token")
        .setAuthorizationUrl("https://api.twitter.com/oauth/authorize")
        .setConsumerKey(API_KEY)
        .setConsumerSecret(API_KEY_SECRET)
        .setAccessToken(ACCESS_TOKEN, ACCESS_TOKEN_SECRET)
        .setCallbackFunction('authCallback'); // コールバック関数名 
}
function pkceChallengeVerifier() {
    var userProps = PropertiesService.getUserProperties();
    if (!userProps.getProperty("code_verifier")) {
        var verifier = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        for (var i = 0; i < 128; i++) {
            verifier += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        var sha256Hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, verifier);
        var challenge = Utilities.base64Encode(sha256Hash)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        userProps.setProperty("code_verifier", verifier);
        userProps.setProperty("code_challenge", challenge);
    }
}
function logRedirectUri() {
    var service = getService();
    Logger.log(service.getRedirectUri());
}
function main() {
    var service = getService();
    if (service.hasAccess()) {
        Logger.log("Already authorized");
    }
    else {
        var authorizationUrl = service.getAuthorizationUrl();
        Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
    }
}
function authCallback(request) {
    var service = getService();
    var authorized = service.handleCallback(request);
    if (authorized) {
        return HtmlService.createHtmlOutput('Success!');
    }
    else {
        return HtmlService.createHtmlOutput('Denied.');
    }
}
// ------------------------------------------------投稿まわりの処理
/**
 * テキストをポストする処理
 * @function
 * @param {string} content 投稿内容
 * @return {number} ポストID
*/
function send_text_Tweet(content) {
    var payload = {
        text: content
    };
    var service = getService();
    if (service.hasAccess()) {
        var url = "https://api.twitter.com/2/tweets";
        var response = UrlFetchApp.fetch(url, {
            method: 'POST',
            'contentType': 'application/json',
            headers: {
                Authorization: 'Bearer ' + service.getAccessToken()
            },
            muteHttpExceptions: true,
            payload: JSON.stringify(payload)
        });
        var result = JSON.parse(response.getContentText());
        Logger.log(JSON.stringify(result, null, 2));
    }
    else {
        var authorizationUrl = service.getAuthorizationUrl();
        Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
        return null;
    }
    return result.data["id"];
}
/**
 * 画像をポストする処理
 * @function
 * @param {string} image_url 画像のURL
 * @param {string} content 投稿内容
 * @return {number} ポストID
*/
function send_image_Tweet(image_url, content) {
    // 画像のBlobデータを取得
    var imageBlob = UrlFetchApp.fetch(image_url).getBlob();
    // OAuth1.0 Service
    var oauth1Service = getService1();
    // 画像アップロードのURL
    var uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
    // 画像アップロードのPayload
    var payload = {
        media_data: Utilities.base64Encode(imageBlob.getBytes())
    };
    // 画像アップロードのオプション
    var options = {
        method: 'POST',
        payload: payload,
        muteHttpExceptions: true
    };
    // 画像アップロードリクエスト
    var response = oauth1Service.fetch(uploadUrl, options);
    console.log(JSON.parse(response.getContentText()));
    var mediaId = JSON.parse(response.getContentText()).media_id_string;
    console.log('mediaId', mediaId);
    // OAuth2.0認証情報 - getService() = v2
    var oauth2Service = getService();
    // 投稿のURL
    var endpoint2 = 'https://api.twitter.com/2/tweets';
    // 投稿のPayload
    if (oauth2Service.hasAccess()) {
        var tweetPayload = JSON.stringify({
            'text': content,
            'media': {
                'media_ids': [mediaId]
            }
        });
        // 投稿のオプション
        var tweetOptions = {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + oauth2Service.getAccessToken(),
                'Content-Type': 'application/json'
            },
            payload: tweetPayload,
            muteHttpExceptions: true
        };
        // 投稿投稿リクエスト
        var tweetResponse = UrlFetchApp.fetch(endpoint2, tweetOptions);
        // レスポンスをログに出力
        console.log(JSON.parse(tweetResponse.getContentText()));
        console.log(JSON.parse(tweetResponse.getContentText()).data.id);
        return JSON.parse(tweetResponse.getContentText()).data.id;
    }
    else {
        return null;
    }
}
/**
 * 動画をポストする処理
 * @function
 * @param {string} video_url 動画のURL(.mp4)
 * @param {string} content 投稿内容
 * @return {number} ポストID
*/
function send_video_Tweet(video_url, content) {
    var twitterService = getService1();
    var sample_movie_url = video_url;
    if (twitterService.hasAccess()) {
        try {
            // v2とv1のエンドポイント
            var endpoint_media = 'https://upload.twitter.com/1.1/media/upload.json';
            var endpoint2 = 'https://api.twitter.com/2/tweets';
            // OAuth2.0認証情報 - getService() = v2
            var oauth2Service = getService();
            //動画の取得
            var movie_blob = UrlFetchApp.fetch(sample_movie_url).getBlob();
            var movie_file_size = movie_blob.getBytes().length;
            console.log(movie_file_size);
            var movie_64 = Utilities.base64Encode(movie_blob.getBytes());
            var movie_64_file_size = movie_64.length;
            console.log(movie_64_file_size);
            // 動画投稿処理
            //INIT
            var movie_init_option = {
                'method': "POST",
                'payload': {
                    'command': 'INIT',
                    'media_type': 'video/mp4',
                    'media_category': "tweet_video",
                    'total_bytes': movie_file_size
                }
            };
            var movie_init = JSON.parse(twitterService.fetch(endpoint_media, movie_init_option));
            console.log(movie_init);
            //APPEND
            var segment_index = 0;
            var bytes_sent = 0;
            var chunk_size = 1000000;
            var chunk_num = Math.ceil(movie_64_file_size / chunk_size);
            for (var index = 0; index < chunk_num; index++) {
                var chunk = movie_64.slice(chunk_size * index, chunk_size * (index + 1));
                console.log(chunk.length);
                var movie_append_option = {
                    'method': "POST",
                    "muteHttpExceptions": true,
                    'payload': {
                        'command': 'APPEND',
                        'media_data': chunk,
                        'media_id': movie_init['media_id_string'],
                        'segment_index': index
                    }
                };
                twitterService.fetch(endpoint_media, movie_append_option);
            }
            //FINALIZE
            var movie_finalize_option = {
                'method': "POST",
                "muteHttpExceptions": true,
                'payload': {
                    'command': 'FINALIZE',
                    'media_id': movie_init['media_id_string']
                }
            };
            var movie_finalize = JSON.parse(twitterService.fetch(endpoint_media, movie_finalize_option));
            console.log(movie_finalize);
            // STATUS
            while (true) {
                var movie_status_option = { 'method': "GET" };
                var movie_status = JSON.parse(twitterService.fetch(endpoint_media + "?command=STATUS&media_id=" + movie_init['media_id_string'], movie_status_option));
                console.log(movie_status);
                if (movie_status["processing_info"]["state"] == "succeeded") {
                    break;
                }
                else if (movie_status["processing_info"]["state"] == "failed") {
                    sheet.getRange(i, 14).setValue(movie_status["processing_info"]["error"]["message"]);
                    throw new Error(movie_status["processing_info"]["error"]["message"]);
                }
                else {
                    Utilities.sleep(movie_status["processing_info"]["check_after_secs"] + 1);
                }
            }
            ;
            // 動画投稿用パラメーター設定
            var payload = {
                'text': content,
                'media': {
                    'media_ids': [movie_init['media_id_string']]
                }
            };
            var response = UrlFetchApp.fetch(endpoint2, {
                method: 'POST',
                'contentType': 'application/json',
                headers: {
                    Authorization: 'Bearer ' + getService().getAccessToken()
                },
                muteHttpExceptions: true,
                payload: JSON.stringify(payload)
            });
            // 動画投稿結果の出力
            var result = JSON.parse(response.getContentText());
            Logger.log(JSON.stringify(result, null, 2));
            return JSON.parse(response.getContentText()).data.id;
        }
        catch (e) {
            console.log(e);
        }
    }
    else {
        return null;
    }
}
/**
 * ツリー投稿する処理
 * @function
 * @param {number} tw_id ポストID
 * @param {string} content 投稿内容
 * @return {number} ポストID
*/
function tree_send_text_Tweet(tw_id, content) {
    var payload = {
        text: content,
        reply: {
            "in_reply_to_tweet_id": tw_id
        }
    };
    var service = getService();
    if (service.hasAccess()) {
        var url = "https://api.twitter.com/2/tweets";
        var response = UrlFetchApp.fetch(url, {
            method: 'POST',
            'contentType': 'application/json',
            headers: {
                Authorization: 'Bearer ' + service.getAccessToken()
            },
            muteHttpExceptions: true,
            payload: JSON.stringify(payload)
        });
        var result = JSON.parse(response.getContentText());
        Logger.log(JSON.stringify(result, null, 2));
    }
    else {
        var authorizationUrl = service.getAuthorizationUrl();
        Logger.log('Open the following URL and re-run the script: %s', authorizationUrl);
    }
    return result.data.id;
}