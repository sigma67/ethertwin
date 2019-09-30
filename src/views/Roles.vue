<template>
    <div class="container mt-5">
    <h2>Current roles: </h2>
        <table class="table table-hover">
            <thead class="thead-light">
                <tr>
                    <th scope="col">DeviceID</th>
                    <th scope="col">Device Name</th>
                    <th scope="col">Role</th> 
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td scope="row">52811</td>
                    <td>Candy Factory Twin</td> 
                    <td>Maintainer</td> 
                </tr>
                <tr>
                    <td scope="row">272832</td>
                    <td>Water Treatment Plant Twin</td>
                    <td>Owner</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
  export default {
    name: "Roles"
      //data: alle twins (ID, name) mit jeweiliger rolle der adresse
      //{{ twin.deviceID }}
      //{{ twin.deviceName }}
      //{{ twin.role }}

  }
</script>

<style scoped>

</style>