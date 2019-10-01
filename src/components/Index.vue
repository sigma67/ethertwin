<template>
    <div class="container mt-5">
        <div class="row justify-content-sm-center">
            <div class="col">
                <h2>Digital Twin Overview</h2>
                <p>{{ account }}</p>
            </div>
            <div class="col text-right"><br/>
                <router-link :to="{ name: 'twin-create' }">
                    <!--<button type="submit" class="btn btn-lg btn-dark w-50">Create Twin</button>-->
                    <button type="submit" class="acticon">
                        <font-awesome-icon id="createIcon" icon="plus-square" data-toggle="tooltip" data-placement="bottom" title="add twin"/>
                    </button>
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
                                <font-awesome-icon icon="search" data-toggle="tooltip" data-placement="bottom" title="see specification"/>
                            </router-link>
                            <button class="acticon" v-on:click="shareTwin(twin.address)">
                                <font-awesome-icon icon="share-alt" data-toggle="tooltip" data-placement="bottom" title="share twin"/>
                            </button>
                            <button class="acticon"  v-on:click="removeRole(twin.address, twin.roleNo)">
                                <font-awesome-icon icon="trash" data-placement="bottom" title="remove role"/>
                            </button>
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
      },
      contracts() {
        return this.$store.state.contracts;
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
                        .then(function (roleNo) {
                          let role = vm.$utils.enum2String(Number(roleNo));
                          if (role !== null) {
                            let twin = {};
                            twin.roleNo = roleNo;
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

      async removeRole(twinAddress, role) {
        let vm = this;
        this.$swal.fire({
          type: "warning",
          title: "Do you really want to remove this device?",
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: "yes",
          cancelButtonText: "no"
        })
        .then(function (result) {
          if (result.value) {
            vm.contracts.Authorization.deployed()
              .then(function (auth) {
                return auth.removeRole.sendTransaction(vm.account, role, twinAddress, {
                  from: vm.account
                });
              })
              .then(function () {
                this.twins = this.twins.filter(function(v){
                  return v.address !== twinAddress;
                });

                vm.$swal.fire({
                  type: "success",
                  title: "You have successfully removed this device!",
                  showConfirmButton: false,
                  timer: 2000
                });
              })
              .catch(function (err) {
                alert(err.message);
              });
          }
        });
      },

      async shareTwin(deviceAddress){
        let self = this.$store.state;
        let vm = this;
        this.$swal({
          title: "Share this device",
          confirmButtonClass: "confirm-class",
          cancelButtonClass: "cancel-class",
          showCancelButton: true,
          reverseButtons: true,
          html:
            "<p>You can allow another account to participate in the life cycle of this device. Specify the account and its role to grant it access.</p>" +
            "</br>" +
            "<h5>Address</h5>" +
            '<input id="swal-input2" class="swal2-input">' +
            "</br>" +
            "<h5>Role</h5>" +
            '<select id="swal-input1" class="swal2-input"> <option value="1">Manufacturer</option><option value="2">Owner</option><option value="3">Distributor</option><option value="4">Maintainer</option></select>'
        }).then(
          function (result) {
            if (result.value) {
              // function when confirm button clicked
              let role = $("#swal-input1").val();
              let address = $("#swal-input2").val();

              self.contracts.Authorization.deployed()
                .then(function (instance) {
                  return instance.addRole.sendTransaction(
                    address,
                    Number(role),
                    deviceAddress,
                    {
                      from: vm.account
                    }
                  );
                })
                .then(function (result) {
                  vm.$swal.fire({
                    type: "success",
                    title: "Account has been successfully added.",
                    showConfirmButton: false,
                    timer: 2000
                  });
                })
                .catch(function (err) {
                  alert(err);
                  vm.$swal.fire({
                    type: "error",
                    title: "Oops...",
                    text: "Something went wrong!",
                    footer:
                      "Please check if the account address is correct and keep your privileges in mind!",
                    showConfirmButton: false,
                    timer: 6000
                  });
                });
            }
          },
          function (dismiss) {
            if (dismiss == "cancel") {
              swal("Cancelled", "Device not shared!", "error");
            }
          }
        );
      }
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
    /*
    td img {
        height:25px;
        width:25px;
        cursor: pointer;
        margin-right: 10px;
    }*/
    .acticon{
        border-color: transparent;
        background-color: transparent;
    }
    #createIcon{
        width: 50px;
        height: 50px;
    }
</style>