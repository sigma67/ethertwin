<template>
    <div class="container mt-5">
        <div class="row">
            <div class="col">
                <h2>Digital Twin Overview</h2>
            </div>
        </div>
        <div class="row h-100">
            <div class="col my-auto">
                <div>Add a new twin or select a twin by clicking on an action.</div>
            </div>
            <div class="col-md-4">
                <button class="btn btn-primary float-right ml-1 mb-2" v-on:click="reload">
                    <font-awesome-icon class="createIcon" icon="sync-alt" data-toggle="tooltip" data-placement="bottom" title="refresh"/>
                    Refresh
                </button>
                <router-link :to="{ name: 'twin-create' }">
                    <button class="btn btn-dark float-right">
                        <font-awesome-icon class="createIcon" icon="plus-square" data-toggle="tooltip" data-placement="bottom" title="refresh"/>
                        Add Twin
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
                    <tr v-for="(twin, i) in twins" v-bind:key="i" v-bind:class="{'table-active': twin.deviceId === selectedTwin}">
                        <td>{{ twin.deviceName }}</td>
                        <td>{{ twin.address }}</td>
                        <td>{{ twin.role }}</td>
                        <td>
                            <router-link :to="{ name: 'twin-spec', params: { twin: twin.deviceId  } }"
                                         v-on:click.native="parseAML(twin.deviceId, i)" class="px-2">
                                <font-awesome-icon icon="search" data-toggle="tooltip" data-placement="bottom"
                                                   title="see specification"/>
                            </router-link>
                            <router-link :to="{ name: 'components', params: { twin: twin.deviceId  } }"
                                         v-on:click.native="parseAML(twin.deviceId, i)" class="px-2">
                                <font-awesome-icon icon="sitemap" data-toggle="tooltip" data-placement="bottom"
                                                   title="see components"/>
                            </router-link>
                            <router-link :to="{ name: 'documents', params: { twin: twin.deviceId  } }"
                                         v-on:click.native="parseAML(twin.deviceId, i)" class="px-2">
                                <font-awesome-icon icon="file-alt" data-placement="bottom" title="view documents"/>
                            </router-link>
                            <router-link :to="{ name: 'sensors', params: { twin: twin.deviceId  } }"
                                         v-on:click.native="parseAML(twin.deviceId, i)" class="px-2" v-if="twin.role!=='Distributor'">
                                <font-awesome-icon icon="wifi" data-placement="bottom" title="view sensors"/>
                            </router-link>
                            <router-link :to="{ name: 'sources', params: { twin: twin.deviceId  } }" class="px-2">
                                <font-awesome-icon icon="database" data-placement="bottom"
                                                   title="view external sources"/>
                            </router-link>
                            <span v-on:click="shareTwin(twin.address, twin.deviceId, i)" class="px-2">
                                <font-awesome-icon icon="share-alt" data-toggle="tooltip" data-placement="bottom"
                                               title="share twin"/>
                            </span>
                            <span v-on:click="removeRole(twin.address, twin.roleNo)" class="px-2">
                                <font-awesome-icon icon="trash" data-placement="bottom" title="remove role from twin"/>
                              </span>
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
  export default {
    name: 'Index',
    computed: {
      account() {
        return this.$store.state.user.address
      },
      contracts() {
        return this.$store.state.contracts;
      },
      twins() {
        return this.$store.state.twins;
      },
      selectedTwin(){
        return this.$store.state.selectedTwin
      }
    },
    methods: {
      async parseAML(id, index){
        return this.$store.dispatch('parseAML', {
          deviceId: id,
          twinIndex: index,
          vm: this
        })
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
              vm.contracts.Authorization.removeRole(vm.account, role.toNumber(), twinAddress, {from: vm.account})
                .then(function () {
                  vm.$store.commit('removeTwin', twinAddress);

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
      async shareTwin(deviceAddress, deviceId, twinIndex) {
        let self = this.$store.state;
        let vm = this;
        vm.parseAML(deviceId, twinIndex).then(
          () => {
            let options = '';
            for (let i = 0; i < self.twins[twinIndex].components.length; i++) {
              options += '<li><input type="checkbox" class="mr-2 custom-control-input" id="component' + i + '"value="' + self.twins[twinIndex].components[i].hash + '"/><label class="custom-control-label" for="component' + i + '">' + self.twins[twinIndex].components[i].name + '</label></li>';
            }
            vm.$swal({
              title: "Share this device",
              confirmButtonClass: "confirm-class",
              cancelButtonClass: "cancel-class",
              showCancelButton: true,
              reverseButtons: true,
              html:
                `<p>You can allow another account to participate in the life cycle of this device. Specify the account and its role to grant it access.</p></br>
                 <h5>Address</h5>
                 <input id="swal-input2" class="swal2-input"></br>
                 <h5>Role</h5>
                 <select id="swal-input1" class="swal2-input"> <option value="1">Manufacturer</option><option value="2">Owner</option><option value="3">Distributor</option><option value="4">Maintainer</option></select></br>
                 <h5>Attributes</h5>
                 <ul id="swal-input3" class="checkbox-grid custom-control custom-checkbox">${options}</ul>`
            }).then((result) => {
                if (result.value) { // function when confirm button clicked
                  let role = document.getElementById("swal-input1").value;
                  let address = document.getElementById("swal-input2").value;
                  let attributes = []; //all checked attributes
                  for (let i = 0; i < document.getElementById("swal-input3").children.length; i++) {
                    if (document.getElementById("swal-input3").children[i].children[0].checked == true)
                      attributes.push(document.getElementById("swal-input3").children[i].children[0].value); //hash of component is attribute in authorization contract
                  }
                  attributes.map(window.web3.utils.hexToBytes);
                  vm.$store.commit('spinner', true);
                  //share specification, add role and attributes
                  let transactions = [
                    vm.$swarm.shareFileKey(vm.account, window.web3.utils.sha3(deviceId), address),
                    self.contracts.Authorization.addRole(
                      address,
                      Number(role),
                      deviceAddress,
                      {
                        from: vm.account
                      })];
                  if (attributes.length > 0){
                    transactions.push(
                      self.contracts.Authorization.addAttributes(address,
                        attributes,
                        deviceAddress,
                        {
                          from: vm.account
                        }
                      )
                    )
                  }
                  Promise.all(transactions).then(function () {
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
                    })
                    .finally(() => {
                      vm.$store.commit('spinner', false);
                    })
                  ;
                }
              },
              function (dismiss) {
                if (dismiss === "cancel") {
                  vm.$swal.fire("Cancelled", "Device not shared!", "error");
                }
              }
            );
          })
      },

      async reload(){
        this.$store.commit('spinner', true);
        await this.$store.dispatch('loadTwins');
        this.$store.commit('spinner', false);
      }
    }
  }
</script>

<style>
    .checkbox-grid li {
        float: left;
        width: 50%;
        text-align:left;
        list-style:none
    }
</style>

<style scoped>
    h3 {
        margin: 40px 0 0;
    }

    span {
        cursor: pointer;
    }

    .acticon {
        border-color: transparent;
        background-color: transparent;
    }

    .icon {
        width: 30px;
        height: 30px;
    }
</style>
