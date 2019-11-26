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
        <td v-if="user.role !== 'Device Agent'">{{ user.attribute.join(", ") }}</td>
        <td v-if="user.role !== 'Device Agent'" class="actions">
          <button class="acticon" v-on:click="changeRole(user.address, twinObject.address, user.roleNumber)">
            <font-awesome-icon icon="user-circle" data-toggle="tooltip" data-placement="bottom" title="change role"/>
          </button>
          <button class="acticon" v-on:click="updateAttributes(user.address, twinObject.address, user.attributesHash)">
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
                vm.$swal({
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

            //todo: list all previous attributes to remove them before updating
            //update attributes of user (address)
            async updateAttributes(userAddress, twinAddress, userAttributesHash) {
                let self = this.$store.state;
                let vm = this;
                let options = '';
                for (let i = 0; i < this.twinObject.components.length; i++) {
                    if(userAttributesHash.includes(this.twinObject.components[i].hash)){
                      options += '<li><input type="checkbox" class="mr-2 custom-control-input" id="component' + i + '"value="' + this.twinObject.components[i].hash + '" checked/><label class="custom-control-label" for="component' + i + '">'  + this.twinObject.components[i].name +  '</label></li>';
                    }else {
                    options += '<li><input type="checkbox" class="mr-2 custom-control-input" id="component' + i + '"value="' + this.twinObject.components[i].hash + '"/><label class="custom-control-label" for="component' + i + '">'  + this.twinObject.components[i].name +  '</label></li>';
                    }
                }
                vm.$swal({
                    title: "Change attributes of user",
                    confirmButtonClass: "confirm-class",
                    cancelButtonClass: "cancel-class",
                    showCancelButton: true,
                    reverseButtons: true,
                    html:
                        `<p>You can change the attributes of this account. Specify its new attributes.</p></br>
                        <h5>Address:  ${userAddress} </h5></br>
                        <h5>Attributes</h5>
                        <div id="swal-input1" class="checkbox-grid custom-control custom-checkbox">${options}</div>`
                }).then(
                    function (result) {
                        if (result.value) { // function when confirm button clicked
                            let attributes = []; //all checked attributes
                            for (let i = 0; i < document.getElementById("swal-input1").children.length; i++) {
                                if (document.getElementById("swal-input1").children[i].children[0].checked === true) attributes.push(document.getElementById("swal-input1").children[i].children[0].value); //hash of component is attribute in authorization contract
                            }
                            let previousAttributes = []; //all attributes the user had
                            previousAttributes = userAttributesHash;
                            let addAttributes = []; //attributes to be added
                            let removeAttributes = []; //attributes to be removed
                            
                            //calculate diff to identify attributes to be added
                            for(let j=0; j<attributes.length; j++){
                                if(!previousAttributes.includes(attributes[j])){
                                    addAttributes.push(attributes[j]);
                                }
                            }
                            //calculate diff to identify attributes to be removed
                            for(let k=0; k<previousAttributes.length; k++){
                                if(!attributes.includes(previousAttributes[k])){
                                    removeAttributes.push(previousAttributes[k]);
                                }
                            }
                            addAttributes.map(web3.utils.hexToBytes);
                            removeAttributes.map(web3.utils.hexToBytes);
                  
                            //only remove when there are attributes to remove
                            let remove = (removeAttributes.length > 0) ? self.contracts.Authorization.removeAttributes(userAddress, removeAttributes, twinAddress,
                                {from: vm.account}) : Promise.resolve(); // or empty promise
                            //only add when there are attributes to add
                            let add = (addAttributes.length > 0) ? self.contracts.Authorization.addAttributes(userAddress, addAttributes, twinAddress,
                                {from: vm.account}) : Promise.resolve(); // or empty promise
                            Promise.all([remove, add]).then(
                                function () {
                                    vm.$swal.fire({
                                        type: "success",
                                        title: "Attributes have been successfully changed.",
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
                                        "Please keep your privileges in mind!",
                                    showConfirmButton: false,
                                    timer: 6000
                                });
                            });
                        }
                    },
                    function (dismiss) {
                        if (dismiss == "cancel") {
                            vm.$swal.fire("Cancelled", "Attributes not altered!", "error");
                        }
                    }
                );
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

        },
        async created() {
            let users = await this.$store.state.contracts.Authorization.getUsers();
            let twinAddress = this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].address;
            for (let i = 0; i < users.length; i++) {
                let role = await this.$store.state.contracts.Authorization.getRole(users[i], twinAddress);
                let roleString = this.$store.state.utils.enum2String(role.toNumber());
                let attributes = [];
                let attributesHash = [];
                let components = []; //otherwise undefined error is thrown
                components = this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].components;
                let bytesComponents = [];
                for (let j = 0; j < components.length; j++) { //for all possible attributes
                    bytesComponents.push(web3.utils.hexToBytes(components[j].hash));
                }
                //check if user has attribute - if so add it to the attributes array
                let hasAttributes = [];
                hasAttributes = await this.$store.state.contracts.Authorization.hasAttributes(users[i], bytesComponents, twinAddress);
                for (let k = 0; k < hasAttributes.length; k++) {
                    if (hasAttributes[k] === true) {
                        attributes.push(components[k].name);
                        attributesHash.push(components[k].hash);
                    }
                }
                let user = new Object;
                user.address = users[i];
                user.role = roleString;
                user.roleNumber = role;
                user.attribute = attributes;
                user.attributesHash = attributesHash;
                this.usersObject.push(user);
            }
        },
    }
</script>

<style>
  .checkbox-grid li{
    float: left;
    width: 50%;
    text-align: left;
    list-style: none
  }
</style>

<style scoped>
  .acticon {
    border-color: transparent;
    background-color: transparent;
  }
  .actions{
    width: 130px;
  }
 
</style>