import { BzzFeed } from '@erebos/bzz-feed'
import { BzzBrowser } from '@erebos/bzz-browser'
import { createKeyPair, sign } from '@erebos/secp256k1'
import config from '../../config'
import crypto from './crypto'
let c = require('crypto');

export default {
  install(Vue, store) {

    // Set up client based on app wallet
    let user = store.state.user;
    let keyPair = createKeyPair(user.wallet.getPrivateKey().toString('hex'));
    let client = new BzzBrowser({ url: config.swarm });
    let feed = new BzzFeed({
      bzz: client,
      signBytes: bytes => Promise.resolve(sign(bytes, keyPair)),
    });

    Vue.prototype.$swarm = {

      async updateFeedSimple(feedParams, update){
        await feed.createManifest(feedParams);
        return feed.setContent(feedParams, JSON.stringify(update), {contentType: "application/json"})
      },

      async updateFeedText(feedParams, update){
        return feed.setContent(feedParams, update, {contentType: "text/plain"})
      },

      async uploadDoc(content, contentType) {
        return new Promise((resolve, reject) => {
          try {
            client
              .uploadFile(content, {contentType: contentType})
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
            client.download(hash)
                .then(response => {
                  switch(type){
                    case "text":
                      resolve(response.text());
                      break;
                    case "json":
                      resolve(response.json());
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
       * @returns {Promise<string>}
       */
      async createFeed(device, topic) {
        try {
          return await feed.createManifest({
            user: device,
            topic: topic,
          });
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
          let options = {contentType: "application/json"};
          let meta = await feed.getMetadata(feedHash);
          let update = {
            time: meta.epoch.time,
            content: contents
          };
          let hash = await client.uploadFile(JSON.stringify(update), options);
          await feed.postChunk(meta, `0x${hash}`, options);
        } catch (err) {
          alert(err);
        }
      },

      /** Retrieve past feed updates
       *
       * @param feedHash Feed manifest hash
       * @param count Number of updates to get
       * @returns {Promise<*>}
       */
      async getFeedUpdates(feedHash, count) {
        let updates = Array();
        try {
          //only retrieves latest content
          let content = await this.getFeedItemJson(feedHash);
          updates.push(content);
          let lastTime = content.time - 1;

          //get past n updates
          while (updates.length < count) {
            let content = await this.getFeedItemJson(feedHash, lastTime);
            lastTime = lastTime === content.time ?
                content.time - 1 :
                content.time;
            updates.push(content);
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
        let meta = await feed.getMetadata(feedHash);
        let content = await feed.getContent({
          user: meta.feed.user,
          topic: meta.feed.topic,
          time: time
        });
        return await content.json();
      },

      async getUserFeedLatest(user, topic) {
        let content = await feed.getContent({
          user: user,
          topic: topic
        });
        return content.json();
      },

      async getUserFeedText(user){
        let content = await feed.getContent({user: user});
        return content.text();
      },
      
      /** Functions related to uploading and downloading encrypted files **/
      createFileKey() {
        return c.randomBytes(32);
      },

      encryptKeyForSelf(key){
        let ownPublicKey = store.state.user.wallet.getPublicKey().toString('hex');
        let ciphertext = crypto.encryptECIES(ownPublicKey, key);
        return [{address: user.address, fileKey: ciphertext}];
      },

      //share an existing key on the user's own feed with another user
      async getAndShareFileKey(user, topic, userAddress) {
        //get existing keys and decrypt key
        let fileKeys = await this.getUserFeedLatest(user, topic);
        let keyObject = fileKeys.filter(f => f.address === user)[0];
        let privateKey = store.state.user.wallet.getPrivateKey().toString('hex');
        let plainKey = crypto.decryptECIES(privateKey, keyObject.fileKey);
        return this.shareFileKey(user, topic, userAddress, plainKey, fileKeys)
      },

      async shareFileKey(user, topic, shareAddress, key,  fileKeys = []){
        let sharePublicKey = await this.getUserFeedText(shareAddress);
        let ciphertext = crypto.encryptECIES(sharePublicKey, key);
        fileKeys.push({address: shareAddress, fileKey: ciphertext})
        return this.updateFeedSimple({user: user, topic: topic}, fileKeys);
      },

      //gets from any feed and decrypts a file key, which was encrypted for the current user
      async getFileKey(user, topic) {
        let fileKeys = await this.getUserFeedLatest(user, topic);
        let keyObject = fileKeys.filter(f => f.address.toLowerCase() === store.state.user.address)[0];
        let privateKey = store.state.user.wallet.getPrivateKey().toString('hex');
        let plainKey = crypto.decryptECIES(privateKey, keyObject.fileKey);
        return new Buffer(plainKey, 'base64');
      },

      async uploadEncryptedDoc (content, contentType, user, topic) {
        let key = await this.getFileKey(user, topic);
        return this.encryptAndUpload(content, contentType, key)
      },

      //content: buffer
      async encryptAndUpload(content, contentType, key) {
        let cipherText = crypto.encryptAES(content, key);
        cipherText.contentType = contentType;
        return this.uploadDoc(JSON.stringify(cipherText), "application/json");
        //return client.uploadData(cipherText)
      },

      async downloadEncryptedDoc(user, topic, hash) {
        let key = await this.getFileKey(user, topic);
        let response = await client.download(hash);
        let res = await response.json();
        return {
          content: crypto.decryptAES(res.encryptedData, key, res.iv),
          type: res.type
        };
      },
    }
  }
};
