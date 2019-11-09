import Web3 from 'web3'
import TruffleContract from '@truffle/contract'
const HDWalletProvider = require("@truffle/hdwallet-provider");
const ethereumjs = require('ethereumjs-wallet');

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
    let provider = new HDWalletProvider([privateKey], "http://localhost:7545", 0, 1);
    window.web3 = new Web3(provider);
    window.web3.eth.defaultAccount = wallet.getAddressString();
    return wallet;
}

async function getSpecification(address, state){
  //check role of user
  return new Promise((resolve, reject) => {
    let vm = state;
    let utils = state.utils;
    state.contracts.Authorization.deployed()
      .then(function (instance) {
        return instance.getRole(vm.user.address, address);
      })
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
              twin.deviceId = res[0];
              twin.deviceName = res[1];
              twin.deviceAgent = res[2];
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
    return new Promise((resolve, reject) => {
      contracts.Authorization = TruffleContract(ABIs.authorization);
      contracts.Authorization.setProvider(web3.currentProvider);

      contracts.ContractRegistry = TruffleContract(ABIs.registry);
      contracts.ContractRegistry.setProvider(web3.currentProvider);

      contracts.ContractRegistry.deployed()
        .then(function (instance1) {
          addresses.ContractRegistryAddress = instance1.address;
        })
        .then(function () {
          contracts.Authorization.deployed()
            .then(function (instance2) {
              addresses.AuthorizationAddress = instance2.address;
              web3.eth.getBalance(state.user.address).then((res) => {
                if (res < web3.utils.toWei("1", "ether"))
                  instance2.register({from: state.user.address})
              });
              commit('contracts', contracts);
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
      state.contracts.ContractRegistry.deployed()
        .then(function (instance1) {
          return instance1.getContracts();
        })
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
}