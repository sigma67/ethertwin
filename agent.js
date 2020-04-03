const config = require('./config');
//swarm
const secp256k1 = require("@erebos/secp256k1");
const bzzfeed = require('@erebos/bzz-feed');
const bzznode = require('@erebos/bzz-node');
//web3
const ethereumjs = require('ethereumjs-wallet');
const WalletSubprovider = require('ethereumjs-wallet/provider-engine');
const ProviderEngine = require('web3-provider-engine');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
const WebsocketSubprovider = require('web3-provider-engine/subproviders/websocket.js');
//contracts
const Web3 = require('web3');
const TruffleContract = require('@truffle/contract');
const ContractRegistry = require('./public/contracts/ContractRegistry.json');
const Authorization = require('./public/contracts/Authorization.json');
const Specification = require('./public/contracts/Specification.json');
//crypto
const c = require('crypto');
const ecies = require('eth-ecies');
//temperature
const vcgencmd = require('vcgencmd');

/** Config **/
let privateKey = config.agent_key
let wallet = ethereumjs.fromPrivateKey(new Buffer(privateKey, 'hex'));
let publicKey = wallet.getPublicKey().toString('hex');
let address = wallet.getAddressString();

/** Swarm Setup **/
let keyPair = secp256k1.createKeyPair(privateKey);
const client = new bzznode.BzzNode({ url: config.swarm });
const feed = new bzzfeed.BzzFeed({
  bzz: client,
  signBytes: bytes => Promise.resolve(secp256k1.sign(bytes, keyPair)),
});

//If not yet published, publish user public key to feed
feed.getContent({user: address}).catch(() => {
  feed.setContent(
    {user: address},
    publicKey,
    {contentType: "text/plain"}
  );
});

/** Web3 and Contracts Setup **/
var engine = new ProviderEngine();
let web3 = new Web3(engine);
engine.addProvider(new FixtureSubprovider());
engine.addProvider(new FilterSubprovider());
engine.addProvider(new WalletSubprovider(wallet));
engine.addProvider(new WebsocketSubprovider({rpcUrl: config.ethereum.rpc}));
engine.start();

let registryContract = TruffleContract(ContractRegistry);
registryContract.setProvider(web3.currentProvider);
let authContract = TruffleContract(Authorization);
authContract.setProvider(web3.currentProvider);

subscribe();
probeTemperature()

async function probeTemperature(){
  let feedHash = "8ff71c988265ccdb70841eebf26690dc7f0fdda234bfc4d72fd8cf5613c4ae90";
  while(1){
    //let temp = vcgencmd.measureTemp()
    let temp = Math.random().toString()
    updateFeed(feedHash, temp)
    await sleep(1000)
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function subscribe() {
  await web3.eth.net.getId();
  let registry = await registryContract.deployed();
  let auth = await authContract.deployed();

  registry.TwinCreated({}, (error, data) => {
    if (error)
      console.log("Error: " + error);
    else {
      if(data.returnValues.deviceAgent.toLowerCase() === address)
        createKeys(data)
    }
  });
  auth.RoleChanged({}, (error, data) => {updateKeys(error, data)});
  auth.AttributesChanged({}, (error, data) => {updateKeys(error, data)});
}

async function createKeys(data){
  let before = new Date();
  let components = await getComponents(data.returnValues.deviceId, data.returnValues.aml, data.returnValues.owner);
  let users = await getUsers();
  //get user role
  let a = await authContract.deployed();
  let usersRoles = await Promise.all(users.map(u => a.getRole(u.toLowerCase(), data.returnValues.contractAddress)));
  users = users.filter((u, ind) => usersRoles[ind] < 5);

  let usersPublicKeys = await Promise.all(users.map(getUserFeedText));
  //add own address and publicKey if not included
  if(!users.map(u => u.toLowerCase()).includes(address)){
    users.push(address);
    usersPublicKeys.push(publicKey);
  }

  //check for each valid user and each component if the user has the attribute
  await Promise.all(components.map(component => createAllKeys(component, data.returnValues.contractAddress, users, usersPublicKeys)));
  let after = new Date();
  console.log(after - before);
}

async function createAllKeys(component, twin, users, usersPublicKeys){
  // let c = await Promise.all(users.map(user => a.hasAttributes(
  //   user,
  //   web3.utils.hexToBytes(component.hash),
  //   twin
  // )));
  // users = users.filter((d, ind) => c[ind]);
  let update = await createComponentKeys(
    address,
    web3.utils.sha3(component.id + "doc"),
    users,
    usersPublicKeys
  );
  update = await createComponentKeys(
    address,
    web3.utils.sha3(component.id + "sensor"),
    users,
    usersPublicKeys
  );
}

async function createComponentKeys(user, topic, shareAddresses, usersPublicKeys) {
  let key = c.randomBytes(32);
  let update = shareAddresses.map((d, ind) => makeFileKey(key, d.toLowerCase(), usersPublicKeys[ind]));
  await updateFeedSimple({user: user, topic: topic}, update);
  return update;
}

function makeFileKey(key, shareAddress, sharePublicKey){
  let ciphertext = encryptECIES(sharePublicKey, key);
  return {address: shareAddress, fileKey: ciphertext};
}

async function updateKeys(error, data){
  if (error)
    console.log("Error: " + error);
  else {
    //check if deviceAgent for this twin
    let twin = await getSpecification(data.returnValues.twin);
    let deviceAgent = await twin.deviceAgent();
    if(deviceAgent.toLowerCase() === address) {

      if (data.returnValues.added) {
        //todo role added
        if (data.returnValues.role) {
          //add keys for all components if owner, else where attribute is present
        }
        //attribute added
        else {
          data.returnValues.attributes.map(attr =>
            shareFileKey(
              address,
              web3.utils.sha3(attr + "doc"),
              data.returnValues.operator
            )
          );
          data.returnValues.attributes.map(attr =>
            shareFileKey(
              address,
              web3.utils.sha3(attr + "sensor"),
              data.returnValues.operator
            )
          );
        }
      } else {
        //todo role removed: remove keys for all components
        if (data.returnValues.role){

        }
        //attribute removed: remove key for that component
        else{
          data.returnValues.attributes.map(attr =>
            removeFileKey(
              address,
              web3.utils.sha3(attr + "doc"),
              data.returnValues.operator
            )
          );
          data.returnValues.attributes.map(attr =>
            removeFileKey(
              address,
              web3.utils.sha3(attr + "sensor"),
              data.returnValues.operator
            )
          );
        }
      }
    }
  }
}

async function getComponents(deviceId, amlHash, owner){
  let aml = (await downloadEncryptedDoc(owner, web3.utils.sha3(deviceId), amlHash.substr(2, amlHash.length))).content.toString();
  //parse aml to get the relevant components: CAEXFile -> InstanceHierarchy -> InternalElement (=Array with all components)
  // InternalElement.[0] ._Name  ._ID  ._RefBaseSystemUnitPath
  var DomParser = require('xmldom').DOMParser;
  let parser = new DomParser();
  let amlDoc = parser.parseFromString(aml, "text/xml");
  let instanceHierarchy = amlDoc.getElementsByTagName("InstanceHierarchy");

  //all child nodes are high-level components
  let childNodes = instanceHierarchy[0].childNodes;
  let components = [];
  for (let i = 0; i < childNodes.length; i++) {
    //all children of type "InternalElement" are high-level components
    if (childNodes[i].nodeName === "InternalElement") {
      let id = childNodes[i].getAttribute("ID");
      let name = childNodes[i].getAttribute("Name");
      let hash = web3.utils.sha3(id);
      // add parsed components to the components array
      components.push({id: id, name: name, hash: hash});
    }
  }
  return components;
}

async function getUsers(){
  let auth = await authContract.deployed();
  return auth.getUsers();
}

/** HELPERS */
async function getSpecification(address){
  let truffle = TruffleContract(Specification);
  truffle.setProvider(web3.currentProvider);
  return await truffle.at(address)
}

async function downloadEncryptedDoc(user, topic, hash) {
  let key = await getFileKey(user, topic);
  let response = await client.download(hash);
  let res = await response.json();
  return {
    content: decryptAES(res.encryptedData, key, res.iv),
    type: res.type
  };
}

async function getUserFeedText(user){
  let content = await feed.getContent({user: user});
  return await content.text();
}

async function getUserFeedLatest(user, topic) {
  let content = await feed.getContent({
    user: user,
    topic: topic
  });
  return content.json();
}

async function updateFeedSimple(feedParams, update){
  return feed.setContent(feedParams, JSON.stringify(update), {contentType: "application/json"})
}

async function updateFeed(feedHash, contents) {
  let options = {contentType: "application/json"};
  let meta = await feed.getMetadata(feedHash);
  let update = {
    time: meta.epoch.time,
    content: contents
  };
  let hash = await client.uploadFile(JSON.stringify(update), options);
  try {
    await feed.postChunk(meta, `0x${hash}`, options);
  }
  catch(err){console.log(err)}
}

async function getFileKey(user, topic) {
  let content = await feed.getContent({
    user: user,
    topic: topic
  });
  let fileKeys = await content.json();
  let keyObject = fileKeys.filter(f => f.address.toLowerCase() === address.toLowerCase())[0];
  let plainKey = decryptECIES(privateKey, keyObject.fileKey);
  return Buffer.from(plainKey, 'base64');
}

//share an existing key on the user's own feed with another user
async function shareFileKey(user, topic, userAddress) {
  //get existing keys and decrypt key
  let fileKeys = await getUserFeedLatest(user, topic);
  let keyObject = fileKeys.filter(f => f.address === user)[0];
  let plainKey = decryptECIES(privateKey, keyObject.fileKey);
  //encrypt for new user
  let userPublicKey = await getUserFeedText(userAddress);
  let newKey = encryptECIES(userPublicKey, plainKey);
  fileKeys.push({address: userAddress, fileKey: newKey});
  await updateFeedSimple({user: user, topic: topic}, fileKeys);
}

//remove a user's file key
async function removeFileKey(user, topic, userAddress) {
  let fileKeys = await getUserFeedLatest(user, topic);
  fileKeys = fileKeys.filter(f => f.address !== userAddress);
  await updateFeedSimple({user: user, topic: topic}, fileKeys);
}

/**
 *
 * @param publicKey string
 * @param data Buffer
 * @returns {String}
 */
function encryptECIES(publicKey, data) {
  let userPublicKey = new Buffer(publicKey, 'hex');
  return ecies.encrypt(userPublicKey, data).toString('base64');
}

/**
 *
 * @param privateKey string
 * @param encryptedData base64 string
 * @returns {Buffer}
 */
function decryptECIES(privateKey, encryptedData) {
  let bufferData = new Buffer(encryptedData, 'base64');
  return ecies.decrypt(privateKey, bufferData);
}

function decryptAES(text, key, init_vector) {
  let iv = Buffer.from(init_vector, 'hex');
  let encryptedText = Buffer.from(text, 'base64');
  let decipher = c.createDecipheriv('aes-256-ctr', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}
