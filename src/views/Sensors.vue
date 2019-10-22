<template>
    <div class="container mt-5">
        <h2>Sensors for Twin:  <small class="text-muted">{{ twinObject.deviceName }}</small></h2><br />
        <h5>Add new sensors</h5>
        <p>Select a component and enter the name of the sensor.</p>
        <form class="row" @submit.prevent="addSensor">
            <div class="col">
                <div class="row">
                    <div class="form-group col-md-3">
                        <select id="component" class="form-control" v-model="selectedComponent">
                            <option v-for="component in components" v-bind:value="component.id">{{ component.name }}</option>
                        </select>
                    </div>
                    <div class="form-group col">
                        <input type="text" class="form-control" id="name" placeholder="Sensor name" v-model="name">
                    </div>
                </div>
            </div>
            <div class="form-group col-md-2">
                <button id="upload" class="btn btn-secondary btn-block h-100">
                    <font-awesome-icon icon="plus-square" data-toggle="tooltip" data-placement="bottom" title="upload file"/>
                     Add Sensor
                </button>
            </div>
        </form>
        <hr/>
        <h5>Existing sensors</h5><br />
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">Component</th>
                    <th scope="col">Name</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="sensor in sensors">
                    <td>{{ components[0].name }}</td>
                    <td>{{ sensor.name }}</td>
                    <td>
                        <button class="acticon">
                            <router-link :to="{ name: 'sensor', params: { component: sensor.component, sensor: sensor.number } }">
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
    name: "Sensors.vue",
    data() {
      return {
        components: [
          {name: "HMI", id: "068ec45a-1002-4a75-8e27-21d8e0da6e3d"},
          {name: "PLC", id: "27e368a1-3845-47ee-97ba-48de151e90bc"}
        ],
        selectedComponent: "068ec45a-1002-4a75-8e27-21d8e0da6e3d",
        sensors: [],
        name: ""
      }
    },
    computed: {
      account() {
        return this.$store.state.user.address
      },
      specification() {
        return this.twinObject.specification;
      },
      twinAddress() {
        return this.twinObject.address;
      },
      twinObject() {
        return this.$store.state.twins
          .filter(f => f.deviceId === this.twin)[0];
      }
    },
    props: {
      twin: {
        required: true,
      },
    },
    methods: {
      async addSensor(){
        let hash = await this.$swarm.createFeed(
          this.twinObject.deviceAgent,
          web3.utils.sha3(this.selectedComponent + this.sensors.length)
        );

        await this.specification.addSensor(
          this.selectedComponent,
          this.name,
          this.$utils.swarmHashToBytes(hash),
          { from: this.account }
        );
        await this.loadSensors();
      },

      async deleteSensor(component){

      },

      loadSensors(){
        this.sensors = [];
        return Promise.all(this.components.map(this.loadSensor));
      },

      async loadSensor(component) {
        let componentHash = web3.utils.sha3(component.id);
        let count = await this.specification.getSensorCount(component.id);
        for(let i = 0; i < count.toNumber(); i++){
          let sensor = await this.specification.sensors(componentHash,i);
          sensor.component = componentHash;
          sensor.number = i;
          this.sensors.push(sensor);
        }
      }

    },

    async beforeMount() {
      await this.loadSensors();
    }
  }
</script>

<style scoped>
    .acticon{
        border-color: transparent;
        background-color: transparent;
    }
</style>