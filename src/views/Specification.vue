<template>
    <div class="container mt-5">
        <div class="row justify-content-sm-center">
            <div class="col">
                <h2>Specification for Twin: <small class="text-muted">{{ twinObject.deviceName }}</small></h2>
                <table class="table">
                    <thead>
                    <th width="50%" class="text-left" scope="col">
                        <div id="textAMLVersion" class="container-fluid">
                            Latest Version: <small class="text-muted">{{ versions.length }}</small><br>
                            Author: <small class="text-muted">{{ author }}</small>
                        </div>
                    </th>
                    <th width="25%" class="text-center" scope="col">
                        <span class="dropdown">
                            <a href="#" class="btn btn-secondary" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                                Version <span class="caret">{{ version }}</span>
                            </a>
                            <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                                <li v-for="(version, i) in versions">
                                    <a href="#" v-on:click="loadAML(version, versions.length - i)" class="dropdown-item"><strong>V{{(versions.length - i) + ": " }}</strong> {{new Date(version*1000).toLocaleString("en-US") }}</a>
                                </li>
                            </ul>
                        </span>
                    </th>
                    <th width="25%" class="text-center" scope="col">
                        <form class="text-center" @submit.prevent="saveAML">
                            <button id="submitAML" class="btn btn-secondary" type="submit">
                                <font-awesome-icon icon="save" data-toggle="tooltip" data-placement="bottom" title="save changes"/>
                            </button>
                        </form>
                    </th>
                    </thead>
                </table>
                <textarea id="amlResult" class="form-control" rows="30" >{{ aml }}</textarea>
            </div>
        </div>
    </div>
</template>

<script>
  import $ from 'jquery';
  //const Prism = require('prismjs');

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
    mounted() {
        let script = document.createElement('script')
        //let css = document.createElement('css')
        //script.setAttribute('src', 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.12.0/build/highlight.min.js')
        script.setAttribute('src', 'highlight.pack.js')
        //css.setAttribute('stylesheet', 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.12.0/build/styles/default.min.css')
        document.head.appendChild(script)
        //document.head.appendChild(css)
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
            vm.versions = latest.reverse();
            vm.loadAML(vm.versions[0], vm.versions.length);
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
                // highlighting
              })
          });
      },

      saveAML(){
        let self = this.$store.state;
        let newAML = $("#amlResult").val();
        let vm = this;

        this.$swarm.uploadDoc(newAML).then(hash => {
          self.contracts.SpecificationContract.at(vm.twinAddress).then(function (instance) {
            instance.createNewAMLVersion.sendTransaction(hash, {from: vm.account});
          });
        });
      }
    },

    beforeMount() {
      this.loadVersions();
    }
    /*,
    mounted() {
        const xml = document.getElementById("amlResult").value;
        const html= Prism.highlight(xml, Prism.languages.xml, 'xml');
        document.getElementById("amlResult").value = html;
    }*/
  }

</script>

<style scoped>

</style>