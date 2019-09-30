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

export default{
  async setup({ commit }){
    let web3Provider = setupWeb3();
    commit('web3Provider', web3Provider);
    let account = await loadAccount();
    commit('account', account);
  },

  async initContracts({ commit, state }){
    let contracts = {};
    let addresses = {};
    return new Promise(function (resolve, reject) {
      $.getJSON("contracts/Authorization.json", function (authorization) {
        // Instantiate a new truffle contract from the artifact
        contracts.Authorization = TruffleContract(authorization);
        // Connect provider to interact with contract
        contracts.Authorization.setProvider(state.web3Provider);
      });
      $.getJSON("contracts/ContractRegistry.json", function (contractRegistry) {
        // Instantiate a new truffle contract from the artifact
        contracts.ContractRegistry = TruffleContract(contractRegistry);
        // Connect provider to interact with contract
        contracts.ContractRegistry.setProvider(state.web3Provider);
      }).then(function () {

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
                    result: addresses,
                    callback: (state) => {
                      resolve({state})
                    }
                  });
              });
          }).catch(function (err) {
            reject(err)
          });
      });
    });
  }
}