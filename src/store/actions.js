import Web3 from 'web3'
import TruffleContract from '@truffle/contract'
import config from '../../config.json'
const HDWalletProvider = require("@truffle/hdwallet-provider");
const ethereumjs = require('ethereumjs-wallet');
import utils from 'web3-utils'
let web3;

function setupWeb3(){
    let wallet;
    let privateKey = localStorage.getItem('privateKey');
    if(!privateKey) {
      wallet = ethereumjs.generate();
      privateKey = wallet.getPrivateKey().toString('hex');
      localStorage.setItem('privateKey', wallet.getPrivateKey().toString('hex'))
    }
    else{
      let privateKeyBuffer = new Buffer(privateKey, "hex");
      wallet = ethereumjs.fromPrivateKey(privateKeyBuffer)
    }
    let webSocketProvider = new Web3.providers.WebsocketProvider(config.ethereum.rpc);
    let provider = new HDWalletProvider([privateKey], webSocketProvider, 0, 1);
    window.web3 = new Web3(provider);
    web3 = window.web3;
    window.utils = utils;
    window.web3.eth.defaultAccount = wallet.getAddressString();
    return wallet;
}

async function getSpecification(address, state){
  //check role of user
  return new Promise((resolve) => {
    let vm = state;
    let utils = state.utils;
    state.contracts.Authorization.getRole(vm.user.address, address)
      .then(function (roleNo) {
        let role = utils.enum2String(Number(roleNo));

        if (role !== null && roleNo < 5) {
          let twin = {};
          twin.roleNo = roleNo;
          twin.role = role;

          vm.contracts.SpecificationContract = TruffleContract(state.specificationAbi);
          vm.contracts.SpecificationContract.setProvider(web3.currentProvider);
          vm.contracts.SpecificationContract.at(address).then(function (instance1) {
            twin.specification = instance1;
            twin.address = instance1.address;
            return instance1.getTwin(function(err,res){
              twin.deviceName = res[0];
              twin.deviceAgent = res[1];
              twin.owner = res[2];
            });
          }).then(function () {
            resolve(twin);
          });
        }
        else{
          resolve(null);
        }
      });
  });
}

export default{
  async setup({ commit }){
    let wallet = setupWeb3();
    commit('account', wallet);
  },

  async initContracts({ commit, state }, ABIs){
    let contracts = {};
    let addresses = {};
    let instances = {};
    return new Promise((resolve, reject) => {
      contracts.Authorization = TruffleContract(ABIs.authorization);
      contracts.Authorization.setProvider(web3.currentProvider);

      contracts.ContractRegistry = TruffleContract(ABIs.registry);
      contracts.ContractRegistry.setProvider(web3.currentProvider);

      let registry = (config.ethereum.registry) ?
        contracts.ContractRegistry.at(config.ethereum.registry) :
        contracts.ContractRegistry.deployed();

      registry.then(function (instance1) {
          instances.ContractRegistry = instance1;
          addresses.ContractRegistryAddress = instance1.address;
        })
        .then(function () {
          let auth = (config.ethereum.authorization) ?
            contracts.Authorization.at(config.ethereum.authorization) :
            contracts.Authorization.deployed();

          auth.then(function (instance2) {
              instances.Authorization = instance2;
              addresses.AuthorizationAddress = instance2.address;
              web3.eth.getBalance(state.user.address).then((res) => {
                  if (web3.utils.fromWei(res,'ether') < 80)
                      instance2.register({from: state.user.address})
              });
              commit('contracts', instances);
              commit('addresses',
                {
                  addresses: addresses,
                  callback: (state) => {
                    resolve({state})
                  }
                });
            });
        }).catch(function (err) {
          reject(err)
        });
      });
  },

  async loadTwins({ commit, state }) {
    let vm = this;
    return new Promise((resolve, reject) => {
      state.contracts.ContractRegistry.getContracts()
        .then(function (contracts) {
          //iteration through all elements
          if (contracts.length > 0) {
            state.utils = vm._vm.$utils;
            Promise.all(contracts.map(c => getSpecification(c, state))).then(function(twins) {
              twins = twins.filter(result => (result !== null));
              commit('twins', twins);
              resolve();
            });
          }
          else{
            resolve();
          }
        })
        .catch(function (error) {
          reject(error);
        })
      });
  },

  async loadUsers({commit, state}){
    let users = await state.contracts.Authorization.getUsers();
    return new Promise((resolve) => {
      commit('users', users);
      resolve(users)
    })
  },

  async parseAML({commit, state}, { twinAddress, vm }) {
    if (twinAddress != null) {
      commit('selectTwin', twinAddress);
      let twinIndex = state.twins.findIndex(f => f.address === twinAddress)
      let twin = state.twins[twinIndex]
      if ('components' in twin) return;
      commit('spinner', true);
      let length = await twin.specification.getAMLCount();
      let index = length.toNumber() - 1;

      //get latest version of specification-AML
      let amlInfo = await twin.specification.getAML(index);
      //get AML from Swarm using aml-hash: amlInfo.hash
      let aml = (await vm.$swarm.downloadEncryptedDoc(twin.owner, window.web3.utils.sha3(twinAddress), vm.$utils.hexToSwarmHash(amlInfo.hash))).content;
      //parse aml to get the relevant components: CAEXFile -> InstanceHierarchy -> InternalElement (=Array with all components)
      // InternalElement.[0] ._Name  ._ID  ._RefBaseSystemUnitPath
      let parser = new DOMParser();
      let amlDoc = parser.parseFromString(aml, "text/xml");
      let instanceHierarchy = amlDoc.documentElement.getElementsByTagName("InstanceHierarchy");

      //all child nodes are high-level components
      let childNodes = instanceHierarchy[0].children;

      let components = [];
      for (let i = 0; i < childNodes.length; i++) {
        //all children of type "InternalElement" are high-level components
        if (childNodes[i].nodeName === "InternalElement") {
          let id = childNodes[i].getAttribute("ID");
          let name = childNodes[i].getAttribute("Name");
          let hash = window.web3.utils.sha3(id);
          // add parsed components to the components array
          components.push({id: id, name: name, hash: hash});
        }
      }

      //filter by attributes
      if (twin.role !== "Owner") {
        let a = state.contracts.Authorization;
        let componentsBytes = components.map(c => window.web3.utils.hexToBytes(c.hash));
        let c = await a.hasAttributes.call(
          vm.account,
          componentsBytes,
          twin.specification.address
        );
        components = components.filter((d, ind) => c[ind]);
      }
      commit('addTwinComponents', {twin: twinIndex, aml: aml, components: components});
      commit('spinner', false);
    }
  }

}
