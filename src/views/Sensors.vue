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
                            <option v-for="component in twinObject.components" v-bind:value="component.id" v-bind:key="component.id">
                                {{ component.name }}
                            </option>
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
                <tr v-for="(sensor, i) in sortedSensors" v-bind:key="i">
                    <td>{{ sensor.componentName }}</td>
                    <td>{{ sensor.name }}</td>
                    <td>
                        <button class="acticon">
                            <router-link :to="{ name: 'sensor', params: { component: sensor.componentHash, sensor: sensor.number } }">
                                <font-awesome-icon icon="search" data-placement="bottom" title="view sensor data"/>
                            </router-link>
                        </button>
                        <button class="acticon" v-on:click="removeSensor(sensor.componentId, sensor.number)">
                            <font-awesome-icon icon="trash" data-placement="bottom" title="remove sensor"/>
                        </button>
                    </td>
                </tr>
            </tbody>
         </table>
    </div>
</template>

<script>
  let utils = window.utils;
  export default {
    name: "Sensors.vue",
    data() {
      return {
        selectedComponent: "",
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
      sortedSensors(){
        let unsorted = [...this.sensors]
        return unsorted.sort(function(a,b){
          let val = 0;
          if(a.componentName < b.componentName){
            val = 1;
            if(a.number < b.number){
              val = 2;
            }
          }
          return val;
        })
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
          utils.sha3(this.selectedComponent + this.sensors.length)
        );

        await this.specification.addSensor(
          this.selectedComponent,
          this.name,
          this.$utils.swarmHashToBytes(hash),
          { from: this.account }
        );
        await this.loadSensors();
      },

      async removeSensor(component, index){
        await this.specification.removeSensor(
          component,
          index,
          { from: this.account }
        );
        this.$swal.fire({
          type: "success",
          title: "You have successfully removed this sensor!",
          showConfirmButton: false,
          timer: 2000
        });
        await this.loadSensors();
      },

      loadSensors(){
        this.sensors = [];
        return Promise.all(this.twinObject.components.map(this.loadSensor));
      },

      async loadSensor(component) {
        let componentHash = utils.sha3(component.id);
        let count = await this.specification.getSensorCount(component.id);
        for(let i = 0; i < count.toNumber(); i++){
          let sensor = await this.specification.sensors(componentHash,i);
          sensor.componentId = component.id;
          sensor.componentName = component.name;
          sensor.componentHash = component.hash;
          sensor.number = i;
          this.sensors.push(sensor);
        }
      },

      async load(componentId){
        this.$store.commit('spinner', true);
        this.loadSensors();
        this.selectedComponent = componentId;
        this.$store.commit('spinner', false);
      }

    },

    async beforeMount() {
      if (this.twinObject.components && this.twinObject.components.length > 0) {
        await this.load(this.twinObject.components[0].id);
      }
      else {
        this.$store.subscribe((mutation) => {
          if (mutation.type === "addTwinComponents" && mutation.payload.components.length > 0) {
            this.load(mutation.payload.components[0].id);
          }
        })
      }
    }
  }
</script>

<style scoped>
    .acticon{
        border-color: transparent;
        background-color: transparent;
    }
</style>
