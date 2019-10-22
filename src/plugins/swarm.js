import {SwarmClient} from '@erebos/swarm-browser';
import { createKeyPair, sign } from '@erebos/secp256k1'

//todo: use dynamic private key from app wallet
let keyPair = createKeyPair("79f771f8d5840b11e8bdb9704b40d7ae2cd6ae77af7e56701d1910d9240776a3");
const client = new SwarmClient({
  bzz: {
    signBytes: bytes => Promise.resolve(sign(bytes, keyPair)),
    url: 'http://132.199.123.236:5000'
  }
});

export default {
  install(Vue) {
    Vue.prototype.$swarm = {
      async uploadDoc(content, contentType) {
        return new Promise((resolve, reject) => {
          try {
            client.bzz
                .upload(content, {contentType: contentType})
                .then(hash => {
                  resolve(hash);
                });
          } catch (err) {
            reject(err);
          }
        });
      },

      async downloadDoc(hash, type = "text") {
        return new Promise((resolve, reject) => {
          try {
            client.bzz
                .download(hash)
                .then(response => {
                  switch(type){
                    case "text":
                      resolve(response.text());
                      break;
                    case "file":
                      resolve(response)
                  }
                });
          } catch (err) {
            reject(err);
          }
        });
      },

      /**
       * Create a new feed
       * @param device valid Ethereum address
       * @param topic 32 byte hash (i.e. web3.utils.sha3)
       * @returns {Promise<HexValue & string>}
       */
      async createFeed(device, topic) {
        try {
          let feedHash = await client.bzz.createFeedManifest({
            user: device,
            topic: topic,
          });

          return feedHash;
        } catch (err) {
          alert(err);
        }
      },

      /**
       * Adds a new entry to the feed
       * @param feedHash Feed manifest hash
       * @param contents Content string for JSON
       * @returns {Promise<void>}
       */
      async updateFeed(feedHash, contents) {
        try {
          let update = {
            time: Math.floor(new Date() / 1000),
            content: contents
          };
          await client.bzz.setFeedContent(feedHash, JSON.stringify(update), {contentType: "application/json"})
        } catch (err) {
          alert(err);
        }
      },

      /** Retrieve past feed updates
       *
       * @param feedHash Feed manifest hash
       * @param pastInterval Time in s to go back in time
       * @returns {Promise<*>}
       */
      async getFeedUpdates(feedHash, pastInterval) {
        let updates = Array();
        try {
          //only retrieves latest content
          let content = await this.getFeedItemJson(feedHash);
          updates.push(content);

          let currentTime = Math.floor(Date.now() / 1000);
          let lastTime = content.time;

          //get past updates until time - pastInterval
          while (lastTime > currentTime - pastInterval) {
            let content = await this.getFeedItemJson(feedHash, lastTime - 1);
            if(lastTime === content.time)
              break;
            else {
              updates.push(content);
              lastTime = content.time;
            }
          }
        } catch (err) {
          console.log(err.toString());
        }

        return updates;
      },

      /**
       * Retrieves a JSON item based on a feed hash and timestamp
       * @param feedHash Feed manifest hash
       * @param time Feed time
       * @returns {Promise<any>}
       */
      async getFeedItemJson(feedHash, time = (new Date()) / 1000) {
        let meta = await client.bzz.getFeedMetadata(feedHash);
        let content = await client.bzz.getFeedContent({
          user: meta.feed.user,
          topic: meta.feed.topic,
          time: time
        });
        return await content.json();
      }
    }
  }
};