<template>
  <div class="container mt-5">
    <div class="row justify-content-sm-center">
      <div class="col-md-9">
        <h3 class="text-center">Add Sensor</h3>
        <br/>
        <form class="text-center" > <!-- @submit.prevent="addSensor" -->
          <div class="form-group">
            <label class="text-center" for="sensorID">Sensor ID</label>
            <br/>
            <input class="form-control" type="text" id="sensorID" name="sensorID"/>
            <br/>
            <label class="text-center" for="sensorDescription">Sensor Description</label>
            <br/>
            <input class="form-control" type="text" id="sensorDescription" name="sensorDescription"/>
            <br/>
          </div>
          <button class="btn btn-secondary" type="submit">Add Sensor</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
    export default {
        name: "AddSensor"
    }
</script>

<style scoped>

</style>