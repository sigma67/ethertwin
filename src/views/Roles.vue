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
                    <td> Owner </td>
                    <td></td>
                    <td>
                    </td>
                </tr>
                <tr v-for="user in usersObject" v-if="user.role !== 'Owner'"> 
                    <td>{{ user.address }}</td>
                    <td>{{ user.role }} </td>
                    <td> user.attribute </td> <!-- todo-->
                    <td v-if="user.role !== 'Device Agent'">
                        <button class="acticon">
                            <font-awesome-icon icon="history" data-toggle="tooltip" data-placement="bottom" title="view change history"/>
                        </button>
                        <button class="acticon" v-on:click="addRole(user.address, twinObject.address, role)">
                            <font-awesome-icon icon="user-circle" data-toggle="tooltip" data-placement="bottom" title="assign new role"/>
                        </button>
                        <button class="acticon" v-on:click="addAttribute(user.address, twinObject.address, attribute)">
                            <font-awesome-icon icon="user-tag" data-toggle="tooltip" data-placement="bottom" title="add attribute"/>
                        </button>
                        <button class="acticon" v-on:click="removeRole(user.address, twinObject.address, role)">
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
      data(){
        return{
            usersObject : []
        }
      },
      methods:{
            //todo
          //add role to user (address) -- role has to be a number     uint(RBAC.OWNER)
          async addRole(userAddress, twinAddress, role){
           await this.$store.state.contracts.Authorization.addRole(userAddress, role, twinAddress);
          },
          
          //todo
          //add attribute to user (address)
          async addAttribute(userAddress, twinAddress, attribute){
            await this.$store.state.contracts.Authorization.addAttribute(userAddress, attribute, twinAddress);
          },
          //remove role from user (address) -- role has to be a number     uint(RBAC.OWNER)
          async removeRole(userAddress, twinAddress, role){
              await this.$store.state.contracts.Authorization.removeRole(userAddress, role, twinAddress);
          },
          //remove attribute from user (address)

      }, 
      async created() {
       let users = await this.$store.state.contracts.Authorization.getUsers();
       let twinAddress = this.$store.state.twins.filter(f => f.deviceId === this.twin)[0].address;
        for (let i= 0; i< users.length; i++) {
            let role=  await this.$store.state.contracts.Authorization.getRole(users[i], twinAddress);
            let roleString = this.$store.state.utils.enum2String(role.toNumber());
            let user =  new Object;
            user.address = users[i];
            user.role = roleString;
            this.usersObject.push(user);
        }
        //todo: get attributes
        //let attributes =  await this.$store.state.contracts.Authorization.getAttribute(userAddress, twinObject.address);
        //console.log(attributes);
          },
  }
</script>

<style scoped>
.acticon{
    border-color: transparent;
    background-color: transparent;
}

</style>