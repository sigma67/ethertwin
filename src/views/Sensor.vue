<template>
    <div class="container mt-5">
        <div class="row">
        <div class="col">
            <h2>Sensor Feed:   <small class="text-muted">{{ sensorData.name }}</small></h2>
        </div>
            <!--<button href="#" class="btn btn-primary" v-on:click="addEntry" :disabled="!submitEnabled">
                <font-awesome-icon id="createIcon" icon="plus-square" data-toggle="tooltip" data-placement="bottom" title="add entry"/>
                Add random entry
            </button>-->
            <button href="#" class="btn btn-primary" v-on:click="loadUpdates" :disabled="!submitEnabled">
                <font-awesome-icon id="createIcon" icon="sync-alt" data-toggle="tooltip" data-placement="bottom" title="add entry"/>
                Refresh
            </button>
        </div><br />
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Values</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="!updates.length"><td>No updates found</td></tr>
                <tr v-for="(update, i) in updates" v-bind:key="i">
                    <td class="col-3" >{{ $utils.date(update.time) }}</td>
                    <td>
                        <vue-json-pretty
                                :showLength="true"
                                :deep="1"
                                :data="update.content">
                        </vue-json-pretty>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
  import VueJsonPretty from 'vue-json-pretty'

  export default {
    name: "Sensor.vue",
    components: {
      VueJsonPretty
    },
    data() {
      return {
        sensorData: {},
        swarmHash: "",
        updates: [],
        submitEnabled: true
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
        this.submitEnabled = false;
        setTimeout(() => {
          this.submitEnabled = true;
        }, 1000);
        await this.$swarm.updateFeed(this.swarmHash, Math.random());
        let update = await this.$swarm.getFeedItemJson(this.swarmHash, (new Date()) / 1000 - 1);
        this.updates.unshift(update);
      },

      async loadSensor() {
        this.sensorData = await this.twinObject.specification.sensors(this.component,this.sensor);
        this.swarmHash = this.$utils.hexToSwarmHash(this.sensorData.hash);
        this.loadUpdates();
      },

      async loadUpdates(){
        this.$store.commit('spinner', true);
        this.updates = await this.$swarm.getFeedUpdates(this.swarmHash, 10);
        this.$store.commit('spinner', false);
      }
    },
    async beforeMount() {
      await this.loadSensor();
    }
  }
</script>

<style scoped>

</style>
