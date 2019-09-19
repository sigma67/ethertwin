<template>
    <div>
        <div class="container mt-5">
            <div class="row justify-content-sm-center">
                <div class="col-md-6 col-md-offset-3">
                    <h2>Digital Twin Overview</h2>
                    <p>{{ account }}</p>
                    <table class="table">
                        <thead>
                        <tr>
                            <th scope="col">
                                Name
                            </th>
                            <th scope="col">
                                Contract Address
                            </th>
                            <th scope="col">
                                Role
                            </th>
                            <th scope="col">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="twin in twins" :key="twin.deviceId">
                            <td>{{ twin.deviceName }}</td>
                            <td>{{ twin.address }}</td>
                            <td>{{ twin.role }}</td>
                            <td>1</td>
                        </tr>
                        <tr><td column-span="9">You are not authorized for any device at this time.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
  import Web3 from 'web3';
  import $ from 'jquery';

  export default {
    name: 'Index',
    props: {
      msg: String
    },
    data() {
      return {
        web3Provider: null,
        contracts: {},
        addresses: {},
        twins: [],
        RBAC: {
          DEVICEAGENT: 0,
          MANUFACTURER: 1,
          OWNER: 2,
          DISTRIBUTOR: 3,
          MAINTAINER: 4
        },
        account: "",
      }
    },
    methods: {
      setup() {
        try {
          if (window.ethereum) {
            // for modern DApps browser
            this.web3Provider = window.web3.currentProvider;
            window.web3 = new Web3(ethereum);
            try {
              ethereum.enable();
            } catch (error) {
              console.error(error);
            }
          } else if (web3) {
            // for old DApps browser
            if (typeof web3 !== "undefined") {
              // If a web3 instance is already provided by Meta Mask.
              this.web3Provider = web3.currentProvider;
              window.web3 = new Web3(web3.currentProvider);
            } else {
              // Specify default instance if no web3 instance provided
              this.web3Provider = new Web3.providers.HttpProvider(
                "http://localhost:8545"
              );
              window.web3 = new Web3(web3Provider);
            }
          } else {
            alert(
              "Non-Ethereum browser detected. You should consider trying MetaMask!"
            );
          }
          this.initContract();
          this.loadAccount();
        } catch (err) {
          alert(err.message);
        }
      },

      initContract() {
        let self = this;
        $.getJSON("contracts/Authorization.json", function (authorization) {
          // Instantiate a new truffle contract from the artifact
          self.contracts.Authorization = self.$TruffleContract(authorization);
          // Connect provider to interact with contract
          self.contracts.Authorization.setProvider(self.web3Provider);
        });
        $.getJSON("contracts/ContractRegistry.json", function (contractRegistry) {
          // Instantiate a new truffle contract from the artifact
          self.contracts.ContractRegistry = self.$TruffleContract(contractRegistry);
          // Connect provider to interact with contract
          self.contracts.ContractRegistry.setProvider(self.web3Provider);
        }).then(function () {
            self.contracts.ContractRegistry.deployed()
              .then(function (instance1) {
                self.addresses.ContractRegistryAddress = instance1.address;
              })
              .then(function () {
                self.contracts.Authorization.deployed()
                  .then(function (instance2) {
                    self.addresses.AuthorizationAddress = instance2.address;
                  })
                  .then(function (result) {
                    return self.loadTwins();
                  })
              }).catch(function (err) {
                  alert(err)
            });
          })
          .then(function () {
          });
      },
      loadAccount() {
        let vm = this;
        window.web3.eth.getAccounts(function (error, result) {
          if (!error) {
            vm.account = result[0];
          } else {
            alert(error);
          }
        });
      },

      loadTwins() {
        let self = this;
        this.contracts.Authorization.deployed()
          .then(function (instanceA) {
            return instanceA.deviceAgentAddress.call();
          })
          .then(function (deviceAgent) {
            self.isDeviceAgent = self.account.toLowerCase() === deviceAgent.toLowerCase();
            //after checking, all contracts are retrieved
            self.contracts.ContractRegistry.deployed()
              .then(function (instance1) {
                return instance1.getContracts.call();
              })
              .then(function (contracts) {
                //iteration through all elements
                if (contracts.length > 0) {
                  contracts.forEach(element => {
                    //check role of user
                    var roleNo;
                    self.contracts.Authorization.deployed()
                      .then(function (instance) {
                        return instance.getRole.call(self.account, element);
                      })
                      .then(function (result) {
                        roleNo = result;
                        return self.enum2String(Number(result));
                      })
                      .then(function (role) {
                        if (role !== null) {
                          let twin = {};
                          $.getJSON("contracts/Specification.json", function (specificationContract) {
                            // Instantiate a new truffle contract from the artifact
                            self.contracts.SpecificationContract = self.$TruffleContract(specificationContract);
                            // Connect provider to interact with contract
                            self.contracts.SpecificationContract.setProvider(self.web3Provider);
                          }).then(function() {
                            self.contracts.SpecificationContract.deployed().then(function (instance1) {
                              instance1.deviceID.call(function (err,res) {
                                twin.deviceId = res;
                              });
                              instance1.deviceName.call(function (err,res) {
                                twin.deviceName = res;
                              });
                              twin.address = instance1.address;
                            });
                          });

                          self.twins.push(twin);
                        }
                      });
                  });
                }
              })
              .catch(function (error) {
                alert(error);
              })
          });
      },
      enum2String(enumVal) {
        switch (enumVal) {
          case this.RBAC.DEVICEAGENT:
            return "Device Agent";
          case this.RBAC.MANUFACTURER:
            return "Manufacturer";
          case this.RBAC.OWNER:
            return "Owner";
          case this.RBAC.DISTRIBUTOR:
            return "Distributor";
          case this.RBAC.MAINTAINER:
            return "Maintainer";
          default:
            return null;
        }
      }
    },
    mounted() {
      this.setup();
      console.log(self.twins)
    }
  }
</script>

<style scoped>
    h3 {
        margin: 40px 0 0;
    }
</style>