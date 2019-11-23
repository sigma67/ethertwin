const config = require('./config')
const ContractRegistry = require('./public/contracts/ContractRegistry.json')
const Authorization = require('./public/contracts/Authorization.json')
const Specification = require('./public/contracts/Specification.json')
const secp256k1 = require("@erebos/secp256k1");
const erebos = require("@erebos/swarm-node");
const Web3 = require('web3');
const TruffleContract = require('@truffle/contract');
const HDWalletProvider = require("@truffle/hdwallet-provider");
const c = require('crypto')
const ecies = require('eth-ecies')

/** Config **/
let twin = ""
let privateKey = "90cecdf9597eb555edce7a4fbf780e8e7b1bd3123a13b8acb045ff9641752eea";
let publicKey = "a82623416dc0925330432ac5e34719d0e4e00ca305d283eee94aff2ec63a58f06e2a8ff83af1a5e05a70037a944f4366f486c32c26fa31de23dbb161cd3d1956"
let address = "0x472c27020ed212627d3087ad546e21d220fb1c49"
// const Wallet = require('ethereumjs-wallet')
// const wallet = Wallet.fromPrivateKey(new Buffer(privateKey, 'hex'))
// console.log(wallet.getAddressString())


/** Swarm Setup **/
let keyPair = secp256k1.createKeyPair(privateKey);
const client = new erebos.SwarmClient({
  bzz: {
    signBytes: bytes => Promise.resolve(secp256k1.sign(bytes, keyPair)),
    url: config.swarm
  }
});

//If not yet published, publish user public key to feed
client.bzz.getFeedContent({user: address}).catch(() => {
  client.bzz.setFeedContent(
    {user: address},
    publicKey,
    {contentType: "text/plain"}
  );
});

/** Web3 and Contracts Setup **/
const webSocketProvider = new Web3.providers.WebsocketProvider(config.ethereum.rpc);
let provider = new HDWalletProvider([privateKey], webSocketProvider, 0, 1);
let web3 = new Web3(provider);
let truffle = TruffleContract(ContractRegistry);
truffle.setProvider(web3.currentProvider);
let authContract = TruffleContract(Authorization);
authContract.setProvider(web3.currentProvider);

main()
//updateFileKeys(web3)
//subscribeTwinCreate()

async function main(){
  let before = new Date();
  let twin = await getTwin()
  let components = await getComponents(twin)
  let users = await getUsers();
  let usersPublicKeys = await Promise.all(users.map(getUserFeedText))
  users.push(address)
  usersPublicKeys.push(publicKey);
  //check for each role if it has DOC_READ or SENSOR_READ permission
  let validRoles;

  //check for each user if he has a validRole
  let validUsers;

  //check for each valid user and each component if the user has the attribute
  await Promise.all(components.map(component => updateComponentKeys(component, twin.address, users, usersPublicKeys)))
  let after = new Date();
  console.log(after - before)

  provider.engine.stop()
}

async function updateComponentKeys(component, twin, users, usersPublicKeys){
  // let a = await authContract.deployed();
  // let c = await Promise.all(users.map(user => a.hasAttribute(
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
  // await createFileKey(
  //   address,
  //   web3.utils.sha3(twin + "sensor"),
  //   users
  // );
}

async function createComponentKeys(user, topic, shareAddresses, usersPublicKeys) {
  let key = c.randomBytes(32);
  let update = shareAddresses.map((d, ind) => makeFileKey(key, d, usersPublicKeys[ind]))
  await updateFeedSimple({user: user, topic: topic}, update);
  return update;
}

function makeFileKey(key, shareAddress, sharePublicKey){
  let ciphertext = encryptECIES(sharePublicKey, key.toString('base64'));
  return {address: shareAddress, fileKey: ciphertext};
}

async function subscribeTwinCreate(){
  let registry = await truffle.deployed()

  registry.TwinCreated({}, (error, data) => {
    if (error)
      console.log("Error: " + error);
    else
      console.log("Log data: " + data);
  })
}

async function getTwin(){
  let registry = await truffle.deployed()
  let addresses = await registry.getContracts()
  let contracts = await Promise.all(addresses.map(c => getSpecification(c)))
  let deviceAgents = await Promise.all(contracts.map(async function(c){return c.deviceAgent()}))
  return contracts.filter((c, ind) => deviceAgents[ind].toLowerCase() === address)[0];
}


async function getComponents(twin){
  let res = await twin.getTwin()
  let length = await twin.getAMLCount();
  let index = length.toNumber() - 1;
  let amlInfo = await twin.getAML(index);
  //get AML from Swarm using aml-hash: amlInfo.hash
  let hash = amlInfo.hash
  let aml = (await downloadEncryptedDoc(res[3], web3.utils.sha3(res[0]), hash.substr(2, hash.length))).content.toString();
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
  user = user.toLowerCase();
  let key = await getFileKey(user, topic);
  let response = await client.bzz.download(hash);
  let res = await response.json();
  return {
    content: decryptAES(res.encryptedData, key, res.iv),
    type: res.type
  };
}

async function getUserFeedText(user){
  let content = await client.bzz.getFeedContent({user: user});
  return await content.text();
}

async function updateFeedSimple(feed, update){
  await client.bzz.createFeedManifest(feed);
  return client.bzz.setFeedContent(feed, JSON.stringify(update), {contentType: "application/json"})
}

async function getFileKey(user, topic) {
  let content = await client.bzz.getFeedContent({
    user: user,
    topic: topic
  });
  let fileKeys = await content.json();
  let keyObject = fileKeys.filter(f => f.address === address)[0];
  let plainKey = decryptECIES(privateKey, keyObject.fileKey);
  return Buffer.from(plainKey, 'base64');
}

/** Crypto functions*/
function encryptECIES(publicKey, data) {
  let userPublicKey = Buffer.from(publicKey, 'hex');
  let bufferData = Buffer.from(data);

  let encryptedData = ecies.encrypt(userPublicKey, bufferData);

  return encryptedData.toString('base64')
}

function decryptECIES(privateKey, encryptedData) {
  let userPrivateKey = Buffer.from(privateKey, 'hex');
  let bufferEncryptedData = Buffer.from(encryptedData, 'base64');

  let decryptedData = ecies.decrypt(userPrivateKey, bufferEncryptedData);

  return decryptedData.toString('utf8');
}

function encryptAES(text, key) {
  const iv = randomBytes(16);
  //ISO/IEC 10116:2017
  let cipher = c.createCipheriv('aes-256-ctr', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return {iv: iv.toString('hex'), encryptedData: encrypted.toString('base64')};
}

function decryptAES(text, key, init_vector) {
  let iv = Buffer.from(init_vector, 'hex');
  let encryptedText = Buffer.from(text, 'base64');
  let decipher = c.createDecipheriv('aes-256-ctr', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}