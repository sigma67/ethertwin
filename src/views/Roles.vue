<template>
  <div class="container mt-5">
    <h2>Current users of: <small class="text-muted">{{ twinObject.deviceName }}</small></h2>
    <br>
    <table class="table table-hover">
      <thead class="thead-light">
      <tr>
        <th scope="col" class="col-4">User address</th>
        <th scope="col">Role</th>
        <th scope="col">Attribute(s)</th>
        <th scope="col" class="col-2">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="user in otherUsers(account)" v-bind:key="user.address">
        <td>{{ user.address }}</td>
        <td>{{ user.role }}</td>
        <td v-if="user.role !== 'Device Agent'">{{ user.attribute.join(", ") }}</td> <td  v-if="user.role === 'Device Agent'"></td>
        <td v-if="user.role !== 'Device Agent'" class="actions">
          <button class="acticon" v-on:click="changeRole(user.address, twinObject.address, user.roleNumber)">
            <font-awesome-icon icon="user-circle" data-toggle="tooltip" data-placement="bottom" title="change role"/>
          </button>
          <button v-if="user.role !== 'Owner'" class="acticon" v-on:click="updateAttributes(user.address, twinObject.address, user.attributesHash)">
            <font-awesome-icon icon="user-tag" data-toggle="tooltip" data-placement="bottom"
                               title="change attribute(s)"/>
          </button>
          <button v-if="user.role !== 'Owner'" class="acticon" v-on:click="removeRole(user.address, twinObject.address, user.roleNumber)">
            <font-awesome-icon icon="trash" data-toggle="tooltip" data-placement="bottom" title="remove user"/>
          </button>
        </td><td  v-if="user.role === 'Device Agent'"></td>
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
            },
            otherUsers(account) {
                return this.usersObject.filter(u => u.address !== account);
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
                                    });
                                    vm.loadRole(userAddress, twinAddress).then(
                                        (loadedRole) => {
                                            let index = vm.usersObject.findIndex(u => u.address === userAddress);
                                            vm.usersObject[index].role = loadedRole.roleString;
                                            vm.usersObject[index].roleNumber = loadedRole.roleNo;
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
                        if (dismiss === "cancel") {
                            vm.$swal.fire("Cancelled", "Role not altered!", "error");
                        }
                    });
            },

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
                            addAttributes.map(window.web3.utils.hexToBytes);
                            removeAttributes.map(window.web3.utils.hexToBytes);
                  
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
                                    });
                                    vm.loadAttributes(userAddress, twinAddress).then(
                                        (loadedAttributes) => {
                                            let index = vm.usersObject.findIndex(u => u.address === userAddress);
                                            vm.usersObject[index].attribute = loadedAttributes.attributes;
                                            vm.usersObject[index].attributesHash = loadedAttributes.attributesHash;
                                        }
                                    )
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
                });
                let index = this.usersObject.findIndex(u => u.address === userAddress);
                this.usersObject.splice(index, 1);
            },
            
            async loadAttributes(userAddress, twinAddress) {
                //check if user has attribute - if so add it to the attributes array
                let hasAttributes = [];
                let attributes = [];
                let attributesHash = [];
                let components = []; //otherwise undefined error is thrown
                components = this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].components;
                let bytesComponents = [];
                for (let j = 0; j < components.length; j++) { //for all possible attributes
                    bytesComponents.push(window.web3.utils.hexToBytes(components[j].hash));
                }
                hasAttributes = await this.$store.state.contracts.Authorization.hasAttributes(userAddress, bytesComponents, twinAddress);
                for (let k = 0; k < hasAttributes.length; k++) {
                    if (hasAttributes[k] === true) {
                        attributes.push(components[k].name);
                        attributesHash.push(components[k].hash);
                    }
                }
                return{attributes: attributes, attributesHash: attributesHash};
            },
            
            async loadRole(userAddress, twinAddress){
                let roleNo = await this.$store.state.contracts.Authorization.getRole(userAddress, twinAddress);
                let roleString = this.$store.state.utils.enum2String(roleNo.toNumber());
                return{roleString: roleString, roleNo: roleNo};
            }

        },
        async created() {
            let users = await this.$store.state.contracts.Authorization.getUsers();
            let twinAddress = this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].address;
            for (let i = 0; i < users.length; i++) {
                let loadedRole = await this.loadRole(users[i], twinAddress);
                if(loadedRole.roleNo.toNumber() === 404) continue; 
                let loadedAttributes= await this.loadAttributes(users[i], twinAddress);
                let user = {};
                user.address = users[i];
                user.role = loadedRole.roleString;
                user.roleNumber = loadedRole.roleNo;
                user.attribute = loadedAttributes.attributes;
                user.attributesHash = loadedAttributes.attributesHash;
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
