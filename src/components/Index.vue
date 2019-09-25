<template>
    <div class="container mt-5">
        <div class="row justify-content-sm-center">
            <div class="col">
                <h2>Digital Twin Overview</h2>
                <p>{{ account }}</p>
            </div>
            <div class="col text-right"><br/>
                <router-link :to="{ name: 'twin-create' }">
                    <button type="submit" class="btn btn-lg btn-dark w-50">Create Twin</button>
                </router-link>
            </div>
        </div>
        <div class="row justify-content-sm-center">
            <div class="col">
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
                    <tr v-for="twin in twins" v-if="twins.length > 0">
                        <td>{{ twin.deviceName }}</td>
                        <td>{{ twin.address }}</td>
                        <td>{{ twin.role }}</td>
                        <td>
                            <router-link :to="{ name: 'twin-spec', params: { twin: twin.deviceId  } }">
                                <img src="@/assets/aml.png" style="height:25px; width:25px"/>
                            </router-link>
                        </td>
                    </tr>
                    <tr v-if="twins.length === 0">
                        <td colspan="9">You are not authorized for any device at this time.</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
  import $ from 'jquery';
  import TruffleContract from '@truffle/contract'

  export default {
    name: 'Index',
    props: {
      msg: String
    },
    computed: {
      account () {
        return this.$store.state.user.address
      }
    },
    data() {
      return {
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
      }
    },
    methods: {
      async loadTwins() {
        let self = this.$store.state;
        let vm = this;
        await self.contracts.Authorization.deployed()
          .then(function (instanceA) {
            return instanceA.deviceAgentAddress.call();
          })
          .then(function (deviceAgent) {
            let isDeviceAgent = vm.account.toLowerCase() === deviceAgent.toLowerCase();
            vm.$store.commit('setIsDeviceAgent', isDeviceAgent);
            //after checking, all contracts are retrieved
            self.contracts.ContractRegistry.deployed()
              .then(function (instance1) {
                return instance1.getContracts.call();
              })
              .then(function (contracts) {
                //iteration through all elements
                if (contracts.length > 0) {
                  contracts.forEach(element => {
                    console.log(element);
                    //check role of user
                    var roleNo;
                    self.contracts.Authorization.deployed()
                      .then(function (instance) {
                        return instance.getRole.call(vm.account, element);
                      })
                      .then(function (result) {
                        roleNo = result;
                        console.log(result);
                        return vm.enum2String(Number(result));
                      })
                      .then(function (role) {
                        if (role !== null) {
                          let twin = {};
                          twin.role = role;
                          $.getJSON("contracts/Specification.json", function (specificationContract) {
                            // Instantiate a new truffle contract from the artifact
                            self.contracts.SpecificationContract = TruffleContract(specificationContract);
                            // Connect provider to interact with contract
                            self.contracts.SpecificationContract.setProvider(self.web3Provider);
                          }).then(function () {
                            self.contracts.SpecificationContract.at(element).then(function (instance1) {
                              instance1.deviceID.call(function (err, res) {
                                twin.deviceId = res;
                              });
                              instance1.deviceName.call(function (err, res) {
                                twin.deviceName = res;
                              });
                              console.log(twin.deviceName);
                              twin.address = instance1.address;
                            });
                          }).then(function() {
                            vm.twins.push(twin);
                          });

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
    async mounted() {
      await this.loadTwins();
    }
  }
</script>

<style scoped>
    h3 {
        margin: 40px 0 0;
    }
</style>