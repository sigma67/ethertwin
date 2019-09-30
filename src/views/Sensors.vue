<template>
    <div class="container mt-5">
        <h2>Available Sensor Feeds:</h2>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">DeviceID</th>
                    <th scope="col">SensorID</th>
                    <th scope="col">description</th>
                    <th scope="col">FeedLink</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td scope="row">52811</td>
                    <td>1</td>
                    <td>temperature</td>
                    <td><a>Link to feed</a></td>
                </tr>
            </tbody>
         </table>
        <p>add Sensor Button mit ausklappbaren Inputs</p>
    </div>
</template>

<script>
  export default {
    name: "Sensors.vue"
      //data: verfügbare sensors mit zugehörigen key aus DHT holen
  }
</script>

<style scoped>

</style>