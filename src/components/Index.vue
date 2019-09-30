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
        twins: [],
      }
    },
    methods: {
      async loadTwins() {
        let self = this.$store.state;
        let vm = this;
        return new Promise((resolve, reject) => {
          self.contracts.Authorization.deployed()
            .then(function (instanceA) {
              return instanceA.deviceAgentAddress.call();
            })
            .then(function (deviceAgent) {
              let isDeviceAgent = self.user.address.toLowerCase() === deviceAgent.toLowerCase();
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
                      //check role of user
                      var roleNo;
                      self.contracts.Authorization.deployed()
                        .then(function (instance) {
                          return instance.getRole.call(self.user.address, element);
                        })
                        .then(function (result) {
                          roleNo = result;
                          return vm.$utils.enum2String(Number(result));
                        })
                        .then(function (role) {
                          if (role !== null) {
                            let twin = {};
                            twin.role = role;
                            twin.deviceName = "test";
                            $.getJSON("contracts/Specification.json", function (specificationContract) {
                              // Instantiate a new truffle contract from the artifact
                              self.contracts.SpecificationContract = TruffleContract(specificationContract);
                              // Connect provider to interact with contract
                              self.contracts.SpecificationContract.setProvider(self.web3Provider);
                            })
                            .then(function () {
                              self.contracts.SpecificationContract.at(element).then(function (instance1) {
                                twin.address = instance1.address;
                                return Promise.all([
                                    instance1.deviceID.call(function (err, res) {
                                      twin.deviceId = res;
                                    }),
                                    instance1.deviceName.call(function (err, res) {
                                      twin.deviceName = res;
                                    })
                                ]);
                              }).then(function () {
                                  vm.twins.push(twin);
                                  resolve();
                                });
                            });
                          }
                        });
                    });
                  }
                })
                .catch(function (error) {
                  reject(error);
                })
            });
        });
      },
    },
    beforeMount() {
      this.$store.dispatch('initContracts').then(() => {
        this.loadTwins();
      });
    }
  }
</script>

<style scoped>
    h3 {
        margin: 40px 0 0;
    }
</style>