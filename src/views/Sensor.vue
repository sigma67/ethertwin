<template>
    <div class="container mt-5">
        <div class="row">
        <div class="col">
            <h2>Sensor Feed:   <small class="text-muted">{{ sensorData.name }}</small></h2>
        </div>
            <a href="#" class="btn btn-primary" v-on:click="addEntry">
                <font-awesome-icon id="createIcon" icon="plus-square" data-toggle="tooltip" data-placement="bottom" title="add entry"/>
                Add random entry
            </a>
        </div><br />
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Values</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="update in updates">
                    <td>{{ $utils.date(update.time) }}</td>
                    <td>{{ update.content }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
  export default {
    name: "Sensor.vue",
    data() {
      return {
        sensorData: {},
        swarmHash: "",
        updates: []
      }
    },
    computed: {
      twinObject() {
        return this.$store.state.twins
          .filter(f => f.deviceId === this.twin)[0];
      }
    },
    props: {
      twin: { required: true },
      component: { required: true },
      sensor: { required: true }
    },
    methods: {
      async addEntry(){
        await this.$swarm.updateFeed(this.swarmHash, Math.random());
        this.loadUpdates();
      },

      async loadSensor() {
        this.sensorData = await this.twinObject.specification.sensors(this.component,this.sensor);
        this.swarmHash = this.$utils.hexToSwarmHash(this.sensorData.hash);
        this.loadUpdates();
      },

      async loadUpdates(){
        this.updates = await this.$swarm.getFeedUpdates(this.swarmHash, 86400);
      }
    },
    async beforeMount() {
      await this.loadSensor();
    }
  }
</script>

<style scoped>

</style>