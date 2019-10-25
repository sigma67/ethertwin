<template>
    <div class="container mt-5">
        <h2>External Data Sources for Twin:  <small class="text-muted">{{ twinObject.deviceName }}</small></h2><br />
        <h5>Add new Data Source</h5>
        <form class="row" @submit.prevent="addSource">
            <div class="col">
                <div class="row">
                    <div class="form-group col-md-4">
                        <input type="text" class="form-control" id="uri" placeholder="http://localhost:8080" v-model="uri">
                    </div>
                    <div class="form-group col">
                        <input type="text" class="form-control" id="description" placeholder="Data source description" v-model="description">
                    </div>
                </div>
            </div>
            <div class="form-group col-md-3">
                <button id="upload" class="btn btn-secondary btn-block h-100">
                    <font-awesome-icon icon="plus-square" data-toggle="tooltip" data-placement="bottom" title="upload file"/>
                     Add Data Source
                </button>
            </div>
        </form>
        <hr/>
        <h5>Existing Data Sources</h5><br />
        <table class="table table-hover">
            <thead>
                <tr>
                    <th scope="col">URI</th>
                    <th scope="col">Description</th>
                    <th scope="col">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(source, i) in sources">
                    <td>{{ source[0] }}</td>
                    <td>{{ source[1] }}</td>
                    <td>
                        <button class="acticon">
                            <a :href="source[0]" target="_blank"><font-awesome-icon icon="search" data-placement="bottom" title="view source data"/></a>
                        </button>
                        <button class="acticon" v-on:click="removeSource(i)">
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
    name: "Sources.vue",
    data() {
      return {
        sources: [],
        uri: "",
        description: ""
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
      async addSource(){
        await this.specification.addExternalSource(
          this.uri,
          this.description,
          { from: this.account }
        );
        await this.loadSources();
      },

      async removeSource(index){
        await this.specification.removeExternalSource(
          index,
          { from: this.account }
        );
        this.$swal.fire({
          type: "success",
          title: "You have successfully removed this data source!",
          showConfirmButton: false,
          timer: 2000
        });
        await this.loadSources();
      },

      async loadSources(){
        this.sources = await this.specification.getExternalSourceHistory();
      },
    },

    async beforeMount() {
      this.$store.commit('spinner', true);
      await this.loadSources();
      this.$store.commit('spinner', false);
    }
  }
</script>

<style scoped>
    .acticon{
        border-color: transparent;
        background-color: transparent;
    }
    .col-md-3{
        max-width: 20%;
    }
</style>