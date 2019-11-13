<template>
    <div class="container mt-5">
    <h2>Current users of: <small class="text-muted">{{ twinObject.deviceName }}</small></h2>
        <br>
        <table class="table table-hover">
            <thead class="thead-light">
                <tr>
                    <th scope="col">User address</th>
                    <th scope="col">Role(s)</th>
                    <th scope="col">Attribute(s)</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr> <!-- v-for address in authorization contract -->
                    <td>0xb8972c13fc2f4ed90c246d94e7382d38eaf131e6</td><!-- address (hex value) -->
                    <td>Manufacturer</td><!-- address.roles -->
                    <td>PLC1, PLC2</td><!-- address.attributes -->
                    <td>
                        <button class="acticon">
                            <font-awesome-icon icon="history" data-toggle="tooltip" data-placement="bottom" title="view change history"/>
                        </button>
                        <button class="acticon">
                        <font-awesome-icon icon="user-circle" data-toggle="tooltip" data-placement="bottom" title="add role"/>
                    </button>
                        <button class="acticon">
                            <font-awesome-icon icon="user-tag" data-toggle="tooltip" data-placement="bottom" title="add attribute"/>
                        </button>
                        <button class="acticon" v-on:click="removeRole(twin.address, twin.roleNo)">
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
          return this.$store.state.user.address
      },
      twinObject() {
          return this.$store.state.twins
                  .filter(f => f.deviceId === this.twin)[0];
      },
  },
      methods:{
          // get roles and addresses of users for the SELECTED TWIN from Authorization contract
          //let twinID= this.$store.state.selectedTwin;
          
          //remove role from user (address)
          
          //remove attribute from user (address)
      }
  }
</script>

<style scoped>
.acticon{
    border-color: transparent;
    background-color: transparent;
}

</style>