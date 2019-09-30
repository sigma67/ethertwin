import {SwarmClient} from '@erebos/swarm-browser';
import '@erebos/timeline';

const client = new SwarmClient({
  bzz: {url: 'http://132.199.123.236:5000'}
});

export default {
  install(Vue) {
    Vue.prototype.$swarm = {
      async uploadDoc(content) {
        try {
          client.bzz
            .upload(content, {contentType: 'text/plain'})
            .then(hash => {
              client.bzz.list(hash);
              alert(hash);
            }).then(contents => {
            console.log(contents) // Manifest contents describing the uploaded files
          });
        } catch (err) {
          alert(err);
        }
      },

      async createFeed(device, sensor) {
        try {
          let feedHash = await client.bzz.createFeedManifest({
            user: device,
            name: sensor,
          });

          return feedHash;
        } catch (err) {
          alert(err);
        }
      },

      async updateFeed(feedHash, contents) {
        try {
          await client.bzz.setFeedContent(feedHash, contents, {encrypt: true});
        } catch (err) {
          alert(err);
        }
      },

      // try pollFeedContent for periodic updates?
      /**
       *
       * @param feedHash
       * @param pastInterval Time in s until which feed updates should be returned
       * @returns {Promise<*>}
       */
      // Erebos Timeline? https://github.com/MainframeHQ/aegle/blob/f84f7cf16f58d5ad3e2d11e4728d297d17414c8a/packages/agent/src/messaging.ts
      async getFeedUpdates(feedHash, pastInterval) {
        try {
          //only retrieves latest content
          let updates = Array();
          let content = await client.bzz.getFeedContent(feedHash);
          updates.push(content);

          //get past updates until time - pastInterval
          // let meta = await client.bzz.getFeedMetadata(feedHash);
          // let currentTime = Date.now();
          // let current = meta.epoch.time - 1;
          // while(current > currentTime - pastInterval){
          // 	let content = await client.bzz.getFeedContent({
          // 		user: meta.feed.user,
          // 		topic: meta.feed.topic,
          // 		time: current
          // 	});
          // 	content.body.
          // }
          //retrieve more updates until time is reached

          return updates;
        } catch (err) {
          alert(err);
        }
      }
    }
  }
};