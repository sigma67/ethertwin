const config = require('./config');
//swarm
const secp256k1 = require("@erebos/secp256k1");
const bzzfeed = require('@erebos/bzz-feed');
const bzznode = require('@erebos/bzz-node');
//web3
const Wallet = require('ethereumjs-wallet')
const WalletSubprovider = require('./provider-engine');
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
//sensor data
const fs = require('fs');
const xml2js = require('xml2js');

/** Config **/
console.log(Wallet)
let privateKey = config.agent_key
let wallet = Wallet.default.fromPrivateKey(new Buffer(privateKey, 'hex'));
let publicKey = wallet.getPublicKey().toString('hex');
console.log(publicKey)
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
pushSensorData()

async function pushSensorData(){
  let samples = await getSamples();
  let feedHash = "8ff71c988265ccdb70841eebf26690dc7f0fdda234bfc4d72fd8cf5613c4ae90";
  while(1){
    let logs = []
    let totalDuration = 0
    for await (log of samples.logset.log) {
      logs.push(log)
      let duration = Number(log.duration)
      log.duration = Number(log.duration).toFixed(1)

      //action takes more than 1s -> directly send
      if(duration >= 1000 && totalDuration === 0){
        await updateFeed(feedHash, log)
        console.log(duration)
        await sleep(duration)
      }
      //action takes less than 1s -> batch until > 1s
      else if(totalDuration > 1000){
        await updateFeed(feedHash, logs)
        await sleep(totalDuration)
        console.log(totalDuration)
        totalDuration = 0
        logs = []
      }
      else {
        totalDuration = totalDuration + duration;
        logs.push(log)
        await sleep(100)
      }
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function subscribe() {
  await web3.eth.net.getId();
  let registry = await ((config.ethereum.registry) ?
    registryContract.at(config.ethereum.registry) :
    registryContract.deployed());
  let auth = await ((config.ethereum.authorization) ?
    authContract.at(config.ethereum.authorization) :
    authContract.deployed());

  registry.TwinCreated({}, (error, data) => {
    if (error)
      console.log("Error: " + error);
    else {
      if(data.returnValues.deviceAgent.toLowerCase() === address)
        createKeys(data)
    }
  });
  auth.RoleChanged({}, (error, data) => {updateKeys(error, data, auth)});
  auth.AttributesChanged({}, (error, data) => {updateKeys(error, data, auth)});
}

async function createKeys(data){
  await sleep(1000) //wait for key update by client
  let before = new Date()
  let components = await getComponents(data.returnValues.contractAddress, data.returnValues.aml, data.returnValues.owner);
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
  let promises =
    components.map(component => createComponentKeys(data.returnValues.contractAddress, component, "doc", users, usersPublicKeys));
  promises.push(...
    components.map(component => createComponentKeys(data.returnValues.contractAddress, component, "sensor", users, usersPublicKeys)));
  await Promise.all(promises);
  console.log("File keys created. " + components.length * 2 + " feeds updated in " + (new Date() - before) + "ms.")
}

async function createComponentKeys(twinAddress, component, type, users, usersPublicKeys){
  let update = createSymmetricKeys(
    users,
    usersPublicKeys
  );
  await updateFeedSimple(
    {
      user: address,
      topic: web3.utils.sha3(twinAddress + component.id + type)
    }, update);
  return web3.utils.sha3(twinAddress + component.id + type);
}

function createSymmetricKeys(shareAddresses, usersPublicKeys) {
  let key = c.randomBytes(32);
  return shareAddresses.map((d, ind) => makeFileKey(key, d.toLowerCase(), usersPublicKeys[ind]));
}

function makeFileKey(key, shareAddress, sharePublicKey){
  let ciphertext = encryptECIES(sharePublicKey, key);
  return {address: shareAddress, fileKey: ciphertext};
}

async function updateKeys(error, data, auth){
  if (error)
    console.log("Error: " + error);
  else {
    //check if deviceAgent for this twin
    let before = new Date();
    let twin = await getSpecification(data.returnValues.twin);
    let deviceAgent = await twin.deviceAgent();
    if(deviceAgent.toLowerCase() === address) {
      let [ twinData, amlHistory, publicKey ] = await Promise.all([
        twin.getTwin(),
        twin.getAMLHistory(),
        getUserFeedText(data.returnValues.operator)
      ]);
      let aml = amlHistory[amlHistory.length - 1];
      let components = await getComponents(data.returnValues.twin, aml.hash, twinData[2]);

      //add keys for all components if owner, else where attribute is present
      let [permissionsDocuments, permissionsSensors] = await Promise.all([
        getPermissions(auth, twin.address, data.returnValues.operator, components, 5),
        getPermissions(auth, twin.address, data.returnValues.operator, components, 9)
      ]);

      //documents
      let componentsFiltered = components.filter((c, ind) => permissionsDocuments[ind]);
      let updateKeyCount = componentsFiltered.length;
      let updateFunc = data.returnValues.added ? shareFileKey : removeFileKey;
      let promises = componentsFiltered.map(component => updateFunc(
        address,
        web3.utils.sha3(data.returnValues.twin + component.id + "doc"),
        data.returnValues.operator,
        publicKey
      ));

      //sensors
      componentsFiltered = components.filter((c, ind) => permissionsSensors[ind]);
      updateKeyCount += componentsFiltered.length;
      promises.push(...
        componentsFiltered.map(component => updateFunc(
          address,
          web3.utils.sha3(data.returnValues.twin + component.id + "sensor"),
          data.returnValues.operator,
          publicKey
        ))
      );
      await Promise.all(promises);
      console.log("File keys updated. " + updateKeyCount + " feeds updated in " + (new Date() - before) + "ms.")
    }
  }
}

async function getPermissions(auth, twin, user, components, permission){
  return Promise.all(components.map(c => auth.hasPermissionAndAttribute(
    user,
    permission,
    web3.utils.hexToBytes(c.hash),
    twin
  )));
}

async function getComponents(twinAddress, amlHash, owner){
  let aml = (await downloadEncryptedDoc(owner, web3.utils.sha3(twinAddress), amlHash.substr(2, amlHash.length)))
    .content.toString();
  let amlDoc = await parseXML(aml)
  let components = [];
  for (log of amlDoc.CAEXFile.InstanceHierarchy[0].InternalElement) {
    let id = log.$.ID
    let name = log.$.Name
    let hash = web3.utils.sha3(id);
    // add parsed components to the components array
    components.push({id: id, name: name, hash: hash});
  }

  return components;
}

async function getUsers(){
  let auth = await authContract.deployed();
  return auth.getUsers();
}

/**
 * HELPERS
 */

async function getSpecification(address){
  let truffle = TruffleContract(Specification);
  truffle.setProvider(web3.currentProvider);
  return await truffle.at(address)
}

async function getSamples(){
  return new Promise((resolve, reject) => {
    fs.readFile(__dirname + '/misc/logs.xml', function(err, data) {
      resolve(parseXML(data))
    });
  });
}

async function parseXML(xml){
  let parser = new xml2js.Parser();
  return new Promise((resolve, reject) => {
    parser.parseString(xml, function (err, result) {
      resolve(result);
    });
  });
}

/**
 * SWARM + CRYPTO HELPERS
 */

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
    return await feed.postChunk(meta, `0x${hash}`, options);
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
async function shareFileKey(user, topic, shareAddress, publicKey = "") {
  //get existing keys and decrypt key
  let fileKeys = await getUserFeedLatest(user, topic);//encrypt for new user
  if(!Array.isArray(fileKeys) || fileKeys.includes(shareAddress)) return;
  publicKey = publicKey === "" ? await getUserFeedText(shareAddress) : publicKey;
  let keyObject = fileKeys.filter(f => f.address === user)[0];
  let plainKey = decryptECIES(privateKey, keyObject.fileKey);
  let newKey = encryptECIES(publicKey, plainKey);
  fileKeys.push({address: shareAddress, fileKey: newKey});
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
