<template>
  <div class="container mt-5">
    <div class="col">
      <h2>Available Contracts: <small class="text-muted"></small></h2>
    </div>
    <br>
    <table class="table table-hover">
      <thead class="thead-light">
        <tr>
          <th scope="col">DeviceID</th>
          <th scope="col">Device Name</th> 
          <th scope="col">Contract</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td scope="row">52811</td>
          <td>Candy Factory Twin</td>
          <td>contract accordion style</td>
        </tr>
        <tr>
          <td scope="row">272832</td>
          <td>Water Treatment Plant Twin</td>
          <td>contract accordion style</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
    export default {
      //data: alle twins (ID, name) mit zugehörigen contract
      // {{ twin.ID}}
      // {{ twin.deviceName }}
      // {{ twin.contract }}
      //{{ account }}
    }
</script>

<style scoped>

</style>