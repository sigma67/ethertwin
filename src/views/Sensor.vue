<template>
    <div class="container mt-5">
        <h2>Sensor Feed:   <small class="text-muted">SensorName SensorIDt</small>
        </h2>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">Timestamp</th>
                    <th scope="col">ID</th>
                    <th scope="col">Values</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td scope="row">2019-09-28T16:13:10+00:00</td>
                    <td>1</td>
                    <td>35.7 degree celsius</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
  export default {
    name: "Sensor.vue"
      //data: values von sensor aus DHT holen mit key
  }
</script>

<style scoped>

</style>