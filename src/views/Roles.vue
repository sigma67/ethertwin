<template>
    <div class="container mt-5">
    <h2>Current roles:  <small class="text-muted">TwinID TwinName</small> </h2>
        <br>
        <table class="table table-hover">
            <thead class="thead-light">
                <tr>
                    <th scope="col">Role</th>
                    <th scope="col">User address</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Maintainer</td>
                    <td>hex-Adresse</td>
                    <td><img src="@/assets/trash.png" v-on:click="removeRole(twin.address, twin.roleNo)" /> review Change-History Icon</td>
                </tr>
                <tr>
                    <td>Owner</td>
                    <td>hex-Adresse</td>
                    <td><img src="@/assets/trash.png" v-on:click="removeRole(twin.address, twin.roleNo)" /> review Change-History Icon</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
  export default {
    name: "Roles"
      //data:  twin (ID, name)
      // alle rollen des twins mit jeweiliger adresse
      //{{ twin.deviceID }}
      //{{ twin.deviceName }}
      //{{ twin.role }}
  }
</script>

<style scoped>
    td img {
        height:25px;
        width:25px;
        cursor: pointer;
        margin-right: 10px;
    }

</style>