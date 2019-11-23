<template>
  <div class="container mt-5">
    <h2>Current users of: <small class="text-muted">{{ twinObject.deviceName }}</small></h2>
    <br>
    <table class="table table-hover">
      <thead class="thead-light">
      <tr>
        <th scope="col">User address</th>
        <th scope="col">Role</th>
        <th scope="col">Attribute(s)</th>
        <th scope="col">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr> <!-- list user/owner-->
        <td>{{ account }}</td>
        <td> Owner</td>
        <td></td>
        <td>
        </td>
      </tr>
      <tr v-for="user in usersObject" v-if="user.role !== 'Owner'">
        <td>{{ user.address }}</td>
        <td>{{ user.role }}</td>
        <td>{{ user.attribute }}</td> <!-- todo-->
        <td v-if="user.role !== 'Device Agent'">
          <button class="acticon">
            <font-awesome-icon icon="history" data-toggle="tooltip" data-placement="bottom"
                               title="view change history"/>
          </button>
          <button class="acticon" v-on:click="changeRole(user.address, twinObject.address, user.roleNumber)">
            <font-awesome-icon icon="user-circle" data-toggle="tooltip" data-placement="bottom" title="change role"/>
          </button>
          <button class="acticon" v-on:click="addAttribute(user.address, twinObject.address)">
            <font-awesome-icon icon="user-tag" data-toggle="tooltip" data-placement="bottom"
                               title="change attribute(s)"/>
          </button>
          <button class="acticon" v-on:click="removeRole(user.address, twinObject.address, user.roleNumber)">
            <font-awesome-icon icon="trash" data-toggle="tooltip" data-placement="bottom" title="remove user"/>
          </button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
    export default {
        name: "Roles",
        props: {
            twin: {
                required: true,
            },
        },
        computed: {
            account() {
                return this.$store.state.user.address;
            },
            twinObject() {
                return this.$store.state.twins
                    .filter(f => f.deviceId === this.twin)[0];
            }
        },
        data() {
            return {
                usersObject: []
            }
        },
        methods: {
            async changeRole(userAddress, twinAddress, userOldRoleNumber) {
                let self = this.$store.state;
                let vm = this;
                this.$swal({
                    title: "Change role of user",
                    confirmButtonClass: "confirm-class",
                    cancelButtonClass: "cancel-class",
                    showCancelButton: true,
                    reverseButtons: true,
                    html:
                        "<p>You can change the role of this account. Specify its new role to grant it access.</p>" +
                        "</br>" +
                        "<h5>Address: " + userAddress + "</h5>" +
                        "</br>" +
                        "<h5>Role</h5>" +
                        '<select id="newRole" class="swal2-input"> <option value="1">Manufacturer</option><option value="2">Owner</option><option value="3">Distributor</option><option value="4">Maintainer</option></select>' + "</br>"
                }).then(
                    function (result) { // function when confirm button clicked
                        if (result.value) {
                            let role = document.getElementById("newRole").value;
                            Promise.all([self.contracts.Authorization.removeRole(userAddress, Number(userOldRoleNumber), twinAddress,
                                {from: vm.account}), self.contracts.Authorization.addRole(userAddress, Number(role), twinAddress,
                                {from: vm.account})])
                                .then(function () {
                                    vm.$swal.fire({
                                        type: "success",
                                        title: "Role of account " + userAddress + " has been successfully changed.",
                                        showConfirmButton: false,
                                        timer: 2000
                                    })
                                }).catch(function (err) {
                                alert(err);
                                vm.$swal.fire({
                                    type: "error",
                                    title: "Oops...",
                                    text: "Something went wrong!",
                                    footer:
                                        "Please check if the new role is correct and keep your privileges in mind!",
                                    showConfirmButton: false,
                                    timer: 6000
                                });
                            });
                        }
                    },
                    function (dismiss) {
                        if (dismiss == "cancel") {
                            vm.$swal.fire("Cancelled", "Role not altered!", "error");
                        }
                    });
            },

            //todo
            //add attribute to user (address)
            async addAttribute(userAddress, twinAddress) {
                let attribute = "";
                let self = this.$store.state;
                let vm = this;
                await this.$store.state.contracts.Authorization.addAttribute(userAddress, attribute, twinAddress);
            },

            async removeRole(userAddress, twinAddress, role) {
                await this.$store.state.contracts.Authorization.removeRole(userAddress, Number(role), twinAddress, {from: this.account});
                this.$swal.fire({
                    type: "success",
                    title: "Role of account " + userAddress + " has been successfully removed.",
                    showConfirmButton: false,
                    timer: 2000
                })
            },
            //todo
            //remove attribute from user (address)

        },
        async created() {
            let users = await this.$store.state.contracts.Authorization.getUsers();
            console.log("users length: "+users.length);
            let twinAddress = this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].address;
            for (let i = 0; i < users.length; i++) {
                let role = await this.$store.state.contracts.Authorization.getRole(users[i], twinAddress);
                let roleString = this.$store.state.utils.enum2String(role.toNumber());
                let attributes = [];
                for (let j = 0; j < (this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].components.length); j++) { //for all possible attributes
                    if (this.$store.state.contracts.Authorization.hasAttribute(users[i], web3.utils.hexToBytes((this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].components[j].hash)), twinAddress) == true) { //check if user has attribute - if so add it to the attributes array
                        attributes.push(this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].components[j].name);
                    }
                }
                let user = new Object;
                user.address = users[i];
                user.role = roleString;
                user.roleNumber = role;
                user.attribute = attributes;
                this.usersObject.push(user);
            }
        },
    }
</script>

<style scoped>
  .acticon {
    border-color: transparent;
    background-color: transparent;
  }

</style>