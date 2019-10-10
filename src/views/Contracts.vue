<template>
  <div class="container mt-5">
    <div class="col">
      <h2>Available Contracts: </h2>
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
        <tr v-for="twin in twins" v-if="twins.length > 0">
          <td scope="row">{{ twin.deviceId }}</td>
          <td>{{ twin.deviceName }}</td>
          <td>{{ twin.address }} </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
  export default {
    name: "Contracts",
    computed: {
      twins() {
        return this.$store.state.twins
      }
    }
  }
</script>

<style scoped>

</style>