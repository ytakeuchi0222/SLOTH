/**
 * SLOTH
 * APIを使用したXへの投稿機能(テキスト、画像、動画、ツリー投稿に対応
 */
// ------------------------------------------------プロパティ周りの処理
const UP = PropertiesService.getUserProperties();
const CLIENT_ID = UP.getProperty("CLIENT_ID");
const CLIENT_SECRET = UP.getProperty("CLIENT_SECRET");
const API_KEY = UP.getProperty("API_KEY");
const API_KEY_SECRET = UP.getProperty("API_KEY_SECRET");
const ACCESS_TOKEN = UP.getProperty("ACCESS_TOKEN");
const ACCESS_TOKEN_SECRET = UP.getProperty("ACCESS_TOKEN_SECRET");
const BearerTOKEN = UP.getProperty("BearerTOKEN");
//設定した全プロパティを確認する
function propertiesCheck() {
    const data = UP.getProperties();
    for (let key in data) {
        Logger.log("キー: %s, 値: %s", key, data[key]);
    }
}
//設定した全プロパティを一括削除する
function deleteAllProperties() {
    UP.deleteAllProperties();
}
//プロパティを受け取って設定
function setting(data) {
    for (let key in data) {
        //Logger.log('キー: %s, 値: %s', key, data[key]);
        UP.setProperty(key, data[key]);
    }
}
// ------------------------------------------------Xの認証
//OAuth2.0 Service
function getService() {
    pkceChallengeVerifier();
    let userProps = PropertiesService.getUserProperties();
    let scriptProps = PropertiesService.getScriptProperties();
    return OAuth2.createService("twitter")
        .setAuthorizationBaseUrl("https://twitter.com/i/oauth2/authorize")
        .setTokenUrl(
            "https://api.twitter.com/2/oauth2/token?code_verifier=" +
                userProps.getProperty("code_verifier")
        )
        .setClientId(CLIENT_ID)
        .setClientSecret(CLIENT_SECRET)
        .setCallbackFunction("authCallback")
        .setPropertyStore(userProps)
        .setScope("users.read tweet.read tweet.write offline.access")
        .setParam("response_type", "code")
        .setParam("code_challenge_method", "S256")
        .setParam("code_challenge", userProps.getProperty("code_challenge"))
        .setTokenHeaders({
            Authorization:
                "Basic " +
                Utilities.base64Encode(CLIENT_ID + ":" + CLIENT_SECRET),
            "Content-Type": "application/x-www-form-urlencoded",
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
        .setCallbackFunction("authCallback"); // コールバック関数名
}
function pkceChallengeVerifier() {
    let userProps = PropertiesService.getUserProperties();
    if (!userProps.getProperty("code_verifier")) {
        let verifier = "";
        let possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
        for (let i = 0; i < 128; i++) {
            verifier += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        let sha256Hash = Utilities.computeDigest(
            Utilities.DigestAlgorithm.SHA_256,
            verifier
        );
        let challenge = Utilities.base64Encode(sha256Hash)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
        userProps.setProperty("code_verifier", verifier);
        userProps.setProperty("code_challenge", challenge);
    }
}
function logRedirectUri() {
    let service = getService();
    Logger.log(service.getRedirectUri());
}
function main() {
    let service = getService();
    if (service.hasAccess()) {
        Logger.log("Already authorized");
    } else {
        let authorizationUrl = service.getAuthorizationUrl();
        Logger.log(
            "Open the following URL and re-run the script: %s",
            authorizationUrl
        );
    }
}
//authorizationのリセット
function reset() {
    let service = getService();
    service.reset();
}
function authCallback(request) {
    let service = getService();
    let authorized = service.handleCallback(request);
    if (authorized) {
        return HtmlService.createHtmlOutput("Success!");
    } else {
        return HtmlService.createHtmlOutput("Denied.");
    }
}
// ------------------------------------------------投稿まわりの処理
/**
 * テキストをポストする処理
 * @function
 * @param {string} content 投稿内容
 * @param {string} [re_id] ポストID
 * @return {number} ポストID
 */
function postText(content, re_id) {
    let payload;
    if (re_id) {
        payload = {
            text: content,
            reply: {
                in_reply_to_tweet_id: re_id,
            },
        };
    } else {
        payload = {
            text: content,
        };
    }
    let service = getService();
    if (service.hasAccess()) {
        let url = "https://api.twitter.com/2/tweets";
        let response = UrlFetchApp.fetch(url, {
            method: "POST",
            contentType: "application/json",
            headers: {
                Authorization: "Bearer " + service.getAccessToken(),
            },
            muteHttpExceptions: true,
            payload: JSON.stringify(payload),
        });
        Logger.log(response);
        let result = JSON.parse(response.getContentText());
        Logger.log(JSON.stringify(result, null, 2));
        return result.data["id"];
    } else {
        let authorizationUrl = service.getAuthorizationUrl();
        Logger.log(
            "Open the following URL and re-run the script: %s",
            authorizationUrl
        );
        return null;
    }
}

/**
 * 動画をポストする処理
 * @function
 * @param {string} video_url 動画のURL(.mp4)
 * @param {string} content 投稿内容
 * @param {string} [re_id] ポストID
 * @return {number} ポストID
 */
function postVideo(content, video_url, re_id) {
    let twitterService = getService1();
    let sample_movie_url = video_url;
    if (twitterService.hasAccess()) {
        try {
            // v2とv1のエンドポイント
            let endpoint_media =
                "https://upload.twitter.com/1.1/media/upload.json";
            let endpoint2 = "https://api.twitter.com/2/tweets";
            // OAuth2.0認証情報 - getService() = v2
            let oauth2Service = getService();
            //動画の取得
            let movie_blob = UrlFetchApp.fetch(sample_movie_url).getBlob();
            let movie_file_size = movie_blob.getBytes().length;
            console.log(movie_file_size);
            let movie_64 = Utilities.base64Encode(movie_blob.getBytes());
            let movie_64_file_size = movie_64.length;
            console.log(movie_64_file_size);
            // 動画投稿処理
            //INIT
            let movie_init_option = {
                method: "POST",
                payload: {
                    command: "INIT",
                    media_type: "video/mp4",
                    media_category: "tweet_video",
                    total_bytes: movie_file_size,
                },
            };
            let movie_init = JSON.parse(
                twitterService.fetch(endpoint_media, movie_init_option)
            );
            console.log(movie_init);
            //APPEND
            let segment_index = 0;
            let bytes_sent = 0;
            let chunk_size = 1000000;
            let chunk_num = Math.ceil(movie_64_file_size / chunk_size);
            for (let index = 0; index < chunk_num; index++) {
                let chunk = movie_64.slice(
                    chunk_size * index,
                    chunk_size * (index + 1)
                );
                console.log(chunk.length);
                let movie_append_option = {
                    method: "POST",
                    muteHttpExceptions: true,
                    payload: {
                        command: "APPEND",
                        media_data: chunk,
                        media_id: movie_init["media_id_string"],
                        segment_index: index,
                    },
                };
                twitterService.fetch(endpoint_media, movie_append_option);
            }
            //FINALIZE
            let movie_finalize_option = {
                method: "POST",
                muteHttpExceptions: true,
                payload: {
                    command: "FINALIZE",
                    media_id: movie_init["media_id_string"],
                },
            };
            let movie_finalize = JSON.parse(
                twitterService.fetch(endpoint_media, movie_finalize_option)
            );
            console.log(movie_finalize);
            // STATUS
            while (true) {
                let movie_status_option = { method: "GET" };
                let movie_status = JSON.parse(
                    twitterService.fetch(
                        endpoint_media +
                            "?command=STATUS&media_id=" +
                            movie_init["media_id_string"],
                        movie_status_option
                    )
                );
                console.log(movie_status);
                if (movie_status["processing_info"]["state"] == "succeeded") {
                    break;
                } else if (
                    movie_status["processing_info"]["state"] == "failed"
                ) {
                    sheet
                        .getRange(i, 14)
                        .setValue(
                            movie_status["processing_info"]["error"]["message"]
                        );
                    throw new Error(
                        movie_status["processing_info"]["error"]["message"]
                    );
                } else {
                    Utilities.sleep(
                        movie_status["processing_info"]["check_after_secs"] + 1
                    );
                }
            }
            let payload;
            if (re_id) {
                // 動画投稿用パラメーター設定
                payload = {
                    text: content,
                    reply: {
                        in_reply_to_tweet_id: re_id,
                    },
                    media: {
                        media_ids: [movie_init["media_id_string"]],
                    },
                };
            } else {
                // 動画投稿用パラメーター設定
                payload = {
                    text: content,
                    media: {
                        media_ids: [movie_init["media_id_string"]],
                    },
                };
            }
            let response = UrlFetchApp.fetch(endpoint2, {
                method: "POST",
                contentType: "application/json",
                headers: {
                    Authorization: "Bearer " + getService().getAccessToken(),
                },
                muteHttpExceptions: true,
                payload: JSON.stringify(payload),
            });
            // 動画投稿結果の出力
            let result = JSON.parse(response.getContentText());
            Logger.log(JSON.stringify(result, null, 2));
            return JSON.parse(response.getContentText()).data.id;
        } catch (e) {
            console.log(e);
        }
    } else {
        return null;
    }
}
/**
 * 画像をポストする処理(複数指定可能)
 * @function
 * @param {string|array} image_url 画像のURL(複数指定する場合は配列で渡す)
 * @param {string} content 投稿内容
 * @param {number} [re_id] ポストID(ツリー投稿処理用)
 * @return {number} ポストID
 */
function postImage(content, img_urls, re_id) {
    let arrayFlg = Array.isArray(img_urls);
    let mediaIds;
    if (!arrayFlg) {
        //画像が配列ではなく一つだけの場合
        mediaIds = getMediaId(img_urls);
    } else {
        //配列で複数渡ってきていた場合
        if (img_urls.length < 5) {
            // 画像が4枚以下の場合は順番にエンコード→アップロードする。*2
            mediaIds = getMediaIds(img_urls);
        } else {
            // 5枚以上ある時は分割して投稿。最初の投稿の返信(スレッド)になる。文章は同じ。*1
            let img_urls_now = img_urls.splice(0, 4);
            let tw_id;
            if (re_id) {
                //re_idがある場合はツリーとして投稿する
                tw_id = postImage(content, img_urls_now, re_id);
            } else {
                tw_id = postImage(content, img_urls_now);
            }
            tw_id = postImage(content, img_urls, tw_id);
            return tw_id;
        }
    }
    // OAuth2.0認証情報 - getService() = v2
    let oauth2Service = getService();
    // 投稿のURL
    let endpoint2 = "https://api.twitter.com/2/tweets";
    // 投稿のPayload
    if (oauth2Service.hasAccess()) {
        let tweetPayload;
        if (re_id) {
            tweetPayload = JSON.stringify({
                text: content,
                reply: {
                    in_reply_to_tweet_id: re_id,
                },
                media: {
                    media_ids: mediaIds,
                },
            });
        } else {
            tweetPayload = JSON.stringify({
                text: content,
                media: {
                    media_ids: mediaIds,
                },
            });
        }
        // 投稿のオプション
        let tweetOptions = {
            method: "POST",
            headers: {
                Authorization: "Bearer " + oauth2Service.getAccessToken(),
                "Content-Type": "application/json",
            },
            payload: tweetPayload,
            muteHttpExceptions: true,
        };
        // 投稿投稿リクエスト
        let tweetResponse = UrlFetchApp.fetch(endpoint2, tweetOptions);
        // レスポンスをログに出力
        console.log(JSON.parse(tweetResponse.getContentText()));
        console.log(JSON.parse(tweetResponse.getContentText()).data.id);
        return JSON.parse(tweetResponse.getContentText()).data.id;
    } else {
        return null;
    }
}
//配列の時用
function getMediaIds(img_urls) {
    let mediaIds = [];
    for (let i = 0; i < img_urls.length; i++) {
        // 画像のBlobデータを取得
        let imageBlob = UrlFetchApp.fetch(img_urls[i]).getBlob();
        // OAuth1.0 Service
        let oauth1Service = getService1();
        // 画像アップロードのURL
        let uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
        // 画像アップロードのPayload
        let payload = {
            media_data: Utilities.base64Encode(imageBlob.getBytes()),
        };
        // 画像アップロードのオプション
        let options = {
            method: "POST",
            payload: payload,
            muteHttpExceptions: true,
        };
        // 画像アップロードリクエスト
        let response = oauth1Service.fetch(uploadUrl, options);
        console.log(JSON.parse(response.getContentText()));
        mediaIds[i] = JSON.parse(response.getContentText()).media_id_string;
    }
    console.log("mediaIds", mediaIds);
    return mediaIds;
}
//画像URLが一つだけの時用
function getMediaId(img_url) {
    // 画像のBlobデータを取得
    let imageBlob = UrlFetchApp.fetch(img_url).getBlob();
    // OAuth1.0 Service
    let oauth1Service = getService1();
    // 画像アップロードのURL
    let uploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
    // 画像アップロードのPayload
    let payload = {
        media_data: Utilities.base64Encode(imageBlob.getBytes()),
    };
    // 画像アップロードのオプション
    let options = {
        method: "POST",
        payload: payload,
        muteHttpExceptions: true,
    };
    // 画像アップロードリクエスト
    let response = oauth1Service.fetch(uploadUrl, options);
    console.log(JSON.parse(response.getContentText()));
    let mediaId = JSON.parse(response.getContentText()).media_id_string;
    console.log("mediaId", mediaId);
    return [mediaId];
}
