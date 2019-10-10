<template>
    <div class="container mt-5">
        <h2>Available Sensor Feeds: </h2>
        <div class="container mt-5">
            <router-link :to="{ name: 'sensor-add' }">
                <button class="acticon float-right" type="submit">
                    <font-awesome-icon icon="plus-square" id="addSensor" data-toggle="tooltip" data-placement="bottom" title="add sensor"/>
                </button>
            </router-link>
        </div>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">SensorID</th>
                    <th scope="col">Description</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>temperature sensor</td>
                    <td>
                        <button class="acticon">
                            <router-link :to="{ name: 'sensor' }">                            
                                <font-awesome-icon icon="search" data-placement="bottom" title="view sensor data"/>
                            </router-link>
                        </button>
                        <button class="acticon"> <!-- v-on:click="deleteSensor(sensorId)" -->
                            <font-awesome-icon icon="trash" data-placement="bottom" title="remove sensor"/>
                        </button>
                    </td>
                </tr>
            </tbody>
         </table>
    </div>
</template>

<script>
  export default {
    name: "Sensors.vue"
      //data: verfügbare sensors mit zugehörigen key aus DHT holen
  }
</script>

<style scoped>
    .acticon{
        border-color: transparent;
        background-color: transparent;
    }
    #addSensor{
        width: 30px;
        height: 30px;
    }
</style>