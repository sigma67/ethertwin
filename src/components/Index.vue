<template>
    <div class="container mt-5">
        <div class="row justify-content-sm-center">
            <div class="col">
                <h2>Digital Twin Overview</h2>
            </div>
            <div class="col-md-1 mr-0"><br/>
                <router-link :to="{ name: 'twin-create' }">
                    <button type="submit" class="acticon">
                        <font-awesome-icon id="createIcon" icon="plus-square" data-toggle="tooltip"
                                           data-placement="bottom" title="add twin"/>
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
                    <tr v-for="(twin, i) in twins" v-if="twins.length > 0">
                        <td>{{ twin.deviceName }}</td>
                        <td>{{ twin.address }}</td>
                        <td>{{ twin.role }}</td>
                        <td>
                            <button class="acticon" v-on:click="parseAML(twin.deviceId, i)">
                                <router-link :to="{ name: 'twin-spec', params: { twin: twin.deviceId  } }">
                                    <font-awesome-icon icon="search" data-toggle="tooltip" data-placement="bottom"
                                                       title="see specification"/>
                                </router-link>
                            </button>
                            <button class="acticon" v-on:click="parseAML(twin.deviceId, i)">
                                <router-link :to="{ name: 'components', params: { twin: twin.deviceId  } }">
                                    <font-awesome-icon icon="sitemap" data-toggle="tooltip" data-placement="bottom"
                                                       title="see components"/>
                                </router-link>
                            </button>
                            <button class="acticon" v-on:click="parseAML(twin.deviceId, i)">
                                <router-link :to="{ name: 'documents', params: { twin: twin.deviceId  } }">
                                    <font-awesome-icon icon="file-alt" data-placement="bottom" title="view documents"/>
                                </router-link>
                            </button>
                            <button class="acticon" v-on:click="parseAML(twin.deviceId, i)">
                                <router-link :to="{ name: 'sensors', params: { twin: twin.deviceId  } }">
                                    <font-awesome-icon icon="wifi" data-placement="bottom" title="view sensors"/>
                                </router-link>
                            </button>
                            <button class="acticon" v-on:click="parseAML(twin.deviceId, i)">
                                <router-link :to="{ name: 'sources', params: { twin: twin.deviceId  } }">
                                    <font-awesome-icon icon="database" data-placement="bottom"
                                                       title="view external sources"/>
                                </router-link>
                            </button>
                            <button class="acticon" v-on:click="shareTwin(twin.address, twin.deviceId)">
                                <font-awesome-icon icon="share-alt" data-toggle="tooltip" data-placement="bottom"
                                                   title="share twin"/>
                            </button>
                            <button class="acticon" v-on:click="removeRole(twin.address, twin.roleNo)">
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
      }
    },
    methods: {
      async parseAML(deviceId, twinIndex) {
        if (deviceId != null) {
          this.$store.commit('selectTwin', deviceId);
          let twin = this.$store.state.twins.filter(f => f.deviceId === deviceId)[0];
          if (twin.hasOwnProperty('components')) return;
          //let specification = this.$store.state.contracts.SpecificationContract.at(address);
          let length = await twin.specification.getAMLCount();
          let index = length.toNumber() - 1;

          //get latest version of specification-AML
          let amlInfo = await twin.specification.getAML(index);
          //get AML from Swarm using aml-hash: amlInfo.hash
          let aml = (await this.$swarm.downloadEncryptedDoc(twin.owner, web3.utils.sha3(deviceId), this.$utils.hexToSwarmHash(amlInfo.hash))).content;
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
              let hash = web3.utils.sha3(id);
              // add parsed components to the components array
              components.push({id: id, name: name, hash: hash});
            }
          }

          //filter by attributes
          if (twin.role !== "Owner") {
            let a = this.$store.state.contracts.Authorization;
            let c = await Promise.all(components.map(component => a.hasAttribute.call(
              this.account,
              web3.utils.hexToBytes(component.hash),
              twin.specification.address
            )));
            components = components.filter((d, ind) => c[ind]);
          }

          this.$store.commit('addTwinComponents', {twin: twinIndex, components: components});
        }
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
              vm.contracts.Authorization.removeRole(vm.account, role, twinAddress, {from: vm.account})
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

      async shareTwin(deviceAddress, deviceId) {
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
              let role = document.getElementById("swal-input1").value;
              let address = document.getElementById("swal-input2").value;

              //share specification and add role
              Promise.all([
                vm.$swarm.shareFileKey(vm.account, web3.utils.sha3(deviceId), address),
                self.contracts.Authorization.addRole(
                  address,
                  Number(role),
                  deviceAddress,
                  {
                    from: vm.account
                  })
                ]).then(function () {
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
              vm.$swal.fire("Cancelled", "Device not shared!", "error");
            }
          }
        );
      }
    }
  }
</script>

<style scoped>
    h3 {
        margin: 40px 0 0;
    }

    .acticon {
        border-color: transparent;
        background-color: transparent;
    }

    #createIcon {
        width: 30px;
        height: 30px;
    }
</style>