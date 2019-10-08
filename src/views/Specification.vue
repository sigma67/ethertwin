<template>
    <div class="container mt-5">
        <div class="row justify-content-sm-center">
            <div class="col">
                <h2>AML for Twin {{ twinObject.deviceName }}</h2>
                <table class="table">
                    <thead>
                    <th width="50%" class="text-center" scope="col">
                        <p id="textAMLVersion">latest Version: {{ version + 1 }}<br>
                            author: {{ author }}</p>

                    </th>
                    <th width="25%" class="text-center" scope="col">
                    <div id="optionscontainer">
                        <span class="dropdown">
                            <a href="#" class="btn btn-primary" data-toggle="dropdown" role="button" aria-haspopup="true"
                               aria-expanded="false">
                                Version <span class="caret">{{ version + 1}}</span>
                            </a>
                            <ul class="dropdown-menu">
                                <li v-for="(version, i) in versions">
                                    <a v-on:click="loadAML(version, i)">V{{ i + ": " + new Date(version*1000).toLocaleString("en-US") }}</a>
                                </li>
                            </ul>
                        </span>
                    </div>
                    </th>
                    <th width="25%" class="text-right" scope="col">

                        <form class="text-center" @submit.prevent="saveAML">
                            <button id="submitAML" class="btn btn-primary" type="submit"
                                    style="text-align: center">save changes
                            </button>
                        </form>
                    </th>

                    </thead>
                </table>
                <textarea id="amlResult" class="form-control" rows="30">{{ aml }}</textarea>
            </div>
        </div>
    </div>
</template>

<script>
  import $ from 'jquery';

  export default {
    name: "Specification",
    data() {
      return {
        versions: [],
        author: "",
        aml: "",
        version: 0,
      }
    },
    props: {
      twin: {
        required: true,
      },
    },
    computed: {
      account() {
        return this.$store.state.user.address
      },
      twinObject(){
        return this.$store.state.twins
          .filter(f => f.deviceId === this.twin)[0];
      },
      twinAddress(){
        return this.twinObject.address;
      }
    },
    methods: {
      async loadVersions() {
        let vm = this;
        let instance1 = await this.$store.state.contracts.SpecificationContract.at(this.twinAddress);
        await instance1.getAllAMLInfos.call({from: vm.account}, function (err, latest) {
            vm.versions = latest;
            vm.loadAML(vm.versions[vm.versions.length - 1], vm.versions.length - 1);
        });
      },

      async loadAML(timestamp, version){
        let self = this.$store.state;
        let vm = this;
        this.version = version;
        let instance1 = await self.contracts.SpecificationContract.at(this.twinAddress);
        instance1.getAML.call(timestamp, {from: vm.account}, function (err, result1) {
            vm.author = result1[0];
            let hash = result1[1];
            vm.$swarm.downloadDoc(hash)
              .then(doc => {
                vm.aml = doc.toString();
              })
          });
      },

      saveAML(){
        let self = this.$store.state;
        let newAML = $("#amlResult").val();
        let vm = this;

        this.$swarm.uploadDoc(newAML).then(hash => {
          console.log(hash);
          self.contracts.SpecificationContract.at(vm.twinAddress).then(function (instance) {
            instance.createNewAMLVersion.sendTransaction(hash, {from: vm.account});
          });
        });
      }
    },

    beforeMount() {
      this.loadVersions();
    }
  }
</script>

<style scoped>

</style>