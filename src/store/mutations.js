import Web3 from 'web3'
import $ from 'jquery';
import TruffleContract from '@truffle/contract'

export default {
    setup(state){
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
          state.web3Provider = web3Provider;
          state.TruffleContract = TruffleContract;

          window.web3.eth.getAccounts(function (error, result) {
            if (!error) {
                state.user.address = result[0];
            } else {
              alert(error);
            }
          });
        } catch (err) {
          alert(err.message);
        }
    },

    initContract(state) {
        let self = this;
        $.getJSON("contracts/Authorization.json", function (authorization) {
          // Instantiate a new truffle contract from the artifact
          state.contracts.Authorization = state.TruffleContract(authorization);
          // Connect provider to interact with contract
          state.contracts.Authorization.setProvider(state.web3Provider);
        });
        $.getJSON("contracts/ContractRegistry.json", function (contractRegistry) {
          // Instantiate a new truffle contract from the artifact
          state.contracts.ContractRegistry = state.TruffleContract(contractRegistry);
          // Connect provider to interact with contract
          state.contracts.ContractRegistry.setProvider(state.web3Provider);
        }).then(function () {
          state.contracts.ContractRegistry.deployed()
            .then(function (instance1) {
              state.addresses.ContractRegistryAddress = instance1.address;
            })
            .then(function () {
              state.contracts.Authorization.deployed()
                .then(function (instance2) {
                  state.addresses.AuthorizationAddress = instance2.address;
                })
            }).catch(function (err) {
            alert(err)
          });
        })
    },

    setIsDeviceAgent(state, value){
      state.isDeviceAgent = value;
    }
}