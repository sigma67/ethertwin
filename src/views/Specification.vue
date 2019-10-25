<template>
    <div class="container mt-5">
        <div class="row">
            <h2>Specification for Twin: <small class="text-muted">{{ twinObject.deviceName }}</small></h2>
        </div>
        <hr />
        <div class="row">
            <div class="col text-left" scope="col">
                <div id="textAMLVersion" class="container-fluid">
                    <div class="row">
                        <div class="col-md-3">
                            Latest Version<br/>
                            Author
                        </div>
                        <div class="col">
                            <small class="text-muted">{{ versions.length }}</small><br/>
                            <code class="text-muted">{{ author }}</code>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 text-left" scope="col">
                <div class="dropdown">
                    <a href="#" class="btn btn-secondary btn-block dropdown-toggle" data-toggle="dropdown"
                       role="button" aria-haspopup="true" aria-expanded="false" id="dropdownMenuLink">
                        Version {{ version }}
                    </a>
                    <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
                        <a v-for="(version, i) in versions" href="#"
                           v-on:click="loadAML(version, versions.length - i)" class="dropdown-item">
                            <strong>V{{(versions.length - i) + ": " }}</strong>
                            {{ $utils.date(version[0]) }}
                        </a>
                    </div>
                </div>
            </div>
            <div class="col-md-3 text-center" scope="col">
                <form class="text-center" @submit.prevent="saveAML">
                    <button id="submitAML" class="btn btn-secondary btn-block" type="submit">
                        <font-awesome-icon icon="save" data-toggle="tooltip" data-placement="bottom"
                                           title="save changes"/>
                        Save
                    </button>
                </form>
            </div>
        </div>
        <hr />
        <textarea id="amlResult" class="form-control" rows="30" v-model="aml"></textarea>
    </div>
</template>

<script>
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
      twinObject() {
        return this.$store.state.twins
          .filter(f => f.deviceId === this.twin)[0];
      },
      twinAddress() {
        return this.twinObject.address;
      }
    },
    methods: {
      async loadVersions() {
        let vm = this;
        await this.specification.getAMLHistory.call({from: vm.account}, function (err, latest) {
          vm.versions = latest.reverse();
          vm.loadAML(vm.versions[0], vm.versions.length);
        });
      },

      async loadAML(version, versionNumber) {
        let vm = this;
        this.version = versionNumber;
        this.author = version[1];
        let hash = this.$utils.hexToSwarmHash(version[2]);
        this.$swarm.downloadDoc(hash)
          .then(doc => {
            vm.aml = doc.toString();
            // highlighting
          })
      },

      saveAML() {
        let vm = this;
        console.log(this.aml)
        this.$swarm.uploadDoc(this.aml, 'text/plain').then(hash => {
          vm.specification.addNewAMLVersion.sendTransaction(
            web3.utils.hexToBytes("0x" + hash),
            {from: vm.account}
          ).then(() => {
            vm.loadVersions();
          });
        });
      }
    },

    async beforeMount() {
      this.$store.commit('spinner', true);
      this.specification = await this.$store.state.contracts.SpecificationContract.at(this.twinAddress);
      await this.loadVersions();
      this.$store.commit('spinner', false);
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