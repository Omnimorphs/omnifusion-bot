const axios = require('axios');
const twit = require('twit');

const twitterConfig = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};

const twitterClient = new twit(twitterConfig);

/**
 *
 * @param {{sender: string, toBurn: number, toFuse: number, imageUrl}} fusion
 * @return {string}
 */
const formatTweet = (fusion) => {
    return `${fusion.sender} fused Omnimorph #${fusion.toFuse} and #${fusion.toBurn}!`;
}

/**
 *
 * @param {{sender: string, toBurn: number, toFuse: number, imageUrl}} fusion
 * @return {Promise<void>}
 */
async function tweet(fusion) {
    // Format our image to base64
    const processedImage = await getBase64(fusion.imageUrl);
    const tweetText = formatTweet(fusion);

    twitterClient.post('media/upload', { media_data: processedImage }, (error, media, response) => {
        if (!error) {
            const tweet = {
                status: tweetText,
                media_ids: [media.media_id_string]
            };

            twitterClient.post('statuses/update', tweet, (error, tweet, response) => {
                if (!error) {
                    console.log(`Successfully tweeted: ${tweetText}`);
                } else {
                    console.error(error);
                }
            });
        } else {
            console.error(error);
        }
    });
}

// Format a provided URL into it's base64 representation
function getBase64(url) {
    return axios.get(url, { responseType: 'arraybuffer'}).then(response => Buffer.from(response.data, 'binary').toString('base64'))
}

module.exports = {
    tweet
};
