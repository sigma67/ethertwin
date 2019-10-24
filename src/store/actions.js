import Web3 from 'web3'
import TruffleContract from '@truffle/contract'
import $ from 'jquery'

function setupWeb3(){
  try {
    let web3Provider;
    if (window.ethereum) {
      // for modern DApps browser
      web3Provider = window.web3.currentProvider;
      window.web3 = new Web3(ethereum);
      try {
        ethereum.enable();
      } catch (error) {
        console.error(error);
      }
    } else if (web3) {
      // for old DApps browser
      if (typeof web3 !== "undefined") {
        // If a web3 instance is already provided by Meta Mask
        web3Provider = web3.currentProvider;
        window.web3 = new Web3(web3.currentProvider);
      } else {
        // Specify default instance if no web3 instance provided
        web3Provider = new Web3.providers.HttpProvider(
          "http://localhost:8545"
        );
        window.web3 = new Web3(web3Provider);
      }
    } else {
      alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
    return web3Provider;
  }
  catch (err) {
    alert(err.message);
  }
}

async function loadAccount(){
  return new Promise((resolve, reject) => {
    window.web3.eth.getAccounts(function (error, result) {
      if (!error) {
        resolve(result[0]);
      } else {
        reject(error);
      }
    });
  })
}

async function getSpecification(address, state){
  //check role of user
  return new Promise((resolve, reject) => {
    let vm = state;
    let utils = state.utils;
    state.contracts.Authorization.deployed()
      .then(function (instance) {
        return instance.getRole.call(vm.user.address, address);
      })
      .then(function (roleNo) {
        let role = utils.enum2String(Number(roleNo));
        if (role !== null && roleNo < 5) {
          let twin = {};
          twin.roleNo = roleNo;
          twin.role = role;

          vm.contracts.SpecificationContract = TruffleContract(state.specificationAbi);
          vm.contracts.SpecificationContract.setProvider(vm.web3Provider);
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
    let web3Provider = setupWeb3();
    commit('web3Provider', web3Provider);
    let account = await loadAccount();
    commit('account', account);
  },

  async initContracts({ commit, state }, ABIs){
    let contracts = {};
    let addresses = {};
    return new Promise((resolve, reject) => {
      contracts.Authorization = TruffleContract(ABIs.authorization);
      contracts.Authorization.setProvider(state.web3Provider);

      contracts.ContractRegistry = TruffleContract(ABIs.registry);
      contracts.ContractRegistry.setProvider(state.web3Provider);

      contracts.ContractRegistry.deployed()
        .then(function (instance1) {
          addresses.ContractRegistryAddress = instance1.address;
        })
        .then(function () {
          contracts.Authorization.deployed()
            .then(function (instance2) {
              addresses.AuthorizationAddress = instance2.address;
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