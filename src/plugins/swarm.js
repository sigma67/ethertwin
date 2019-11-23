import {SwarmClient} from '@erebos/swarm-browser';
import { createKeyPair, sign } from '@erebos/secp256k1'
import config from '../../config'
import crypto from './crypto'
let c = require('crypto');

export default {
  install(Vue, store) {

    // Set up client based on app wallet
    let user = store.state.user;
    let keyPair = createKeyPair(user.wallet.getPrivateKey().toString('hex'));
    const client = new SwarmClient({
      bzz: {
        signBytes: bytes => Promise.resolve(sign(bytes, keyPair)),
        url: config.swarm
      }
    });

    //If not yet published, publish user public key to feed
    client.bzz.getFeedContent({user: user.address}).catch(() => {
      client.bzz.setFeedContent(
        {user: user.address},
        user.wallet.getPublicKey().toString('hex'),
        {contentType: "text/plain"}
      );
    });

    Vue.prototype.$swarm = {

      async updateFeedSimple(feed, update){
        await client.bzz.createFeedManifest(feed);
        return client.bzz.setFeedContent(feed, JSON.stringify(update), {contentType: "application/json"})
      },

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
       * @returns {Promise<HexValue & string>}
       */
      async createFeed(device, topic) {
        try {
          return await client.bzz.createFeedManifest({
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
      },

      async getUserFeedLatest(user, topic) {
        let content = await client.bzz.getFeedContent({
          user: user,
          topic: topic
        });
        return await content.json();
      },

      async getUserFeedText(user){
        let content = await client.bzz.getFeedContent({user: user});
        return await content.text();
      },
      
      /** Functions related to uploading and downloading encrypted files **/

      async createFileKey(user, topic, shareAddress) {
        let key = c.randomBytes(32);
        let ownPublicKey = store.state.user.wallet.getPublicKey().toString('hex');
        let ciphertext = crypto.encryptECIES(ownPublicKey, key.toString('base64'));
        let update = [{address: user, fileKey: ciphertext}];
        if(shareAddress){
          let sharePublicKey = await this.getUserFeedText(shareAddress);
          ciphertext = crypto.encryptECIES(sharePublicKey, key.toString('base64'));
          update.push({address: shareAddress, fileKey: ciphertext})
        }
        await this.updateFeedSimple({user: user, topic: topic}, update);
        return key;
      },

      //share an existing key on the user's own feed with another user
      async shareFileKey(user, topic, userAddress) {
        //get existing keys and decrypt key
        let fileKeys = await this.getUserFeedLatest(user, topic);
        let keyObject = fileKeys.filter(f => f.address === user)[0];
        let privateKey = store.state.user.wallet.getPrivateKey().toString('hex');
        let plainKey = crypto.decryptECIES(privateKey, keyObject.fileKey);

        //encrypt for new user
        let userPublicKey = await this.getUserFeedText(userAddress);
        let newKey = crypto.encryptECIES(userPublicKey, plainKey);
        fileKeys.push({address: userAddress, fileKey: newKey});
        await this.updateFeedSimple({user: user, topic: topic}, fileKeys);
      },

      //gets from any feed and decrypts a file key, which was encrypted for the current user
      async getFileKey(user, topic) {
        let fileKeys = await this.getUserFeedLatest(user, topic);
        let keyObject = fileKeys[0];
        //let keyObject = fileKeys.filter(f => f.address === store.state.user.address)[0];
        let privateKey = store.state.user.wallet.getPrivateKey().toString('hex');
        let plainKey = crypto.decryptECIES(privateKey, keyObject.fileKey);
        return new Buffer(plainKey, 'base64');
      },

      async uploadEncryptedDoc (content, contentType, user, topic, newKey = false, shareAddress) {
        let key = newKey ?
          await this.createFileKey(user, topic, shareAddress) :
          await this.getFileKey(user, topic) ;

        return this.encryptAndUpload(content, contentType, key)
      },

      //content: buffer
      async encryptAndUpload(content, contentType, key) {
        let cipherText = crypto.encryptAES(content, key);
        cipherText.contentType = contentType;
        return this.uploadDoc(JSON.stringify(cipherText), "application/json");
      },

      async downloadEncryptedDoc(user, topic, hash) {
        let key = await this.getFileKey(user, topic);
        let response = await client.bzz.download(hash);
        let res = await response.json();
        return {
          content: crypto.decryptAES(res.encryptedData, key, res.iv),
          type: res.type
        };
      },
    }
  }
};