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
                        <a v-for="(version, i) in versions" v-bind:key="i" href="#"
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
        <br/>
        <form class="row" @submit.prevent="uploadDocument">
            <div class="col">
                <div class="row">
                    <div class="input-group mb-3 col">
                        <div class="custom-file">
                            <input type="file" class="custom-file-input" id="inputGroupFile01" @change="processFile">
                            <label class="custom-file-label" for="inputGroupFile01">{{ file }} {{ fileType ? '(' +
                                fileType + ')' : '' }}</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="form-group col-md-2">
                <button id="upload" class="btn btn-secondary btn-block h-100">
                    <font-awesome-icon icon="file-upload" data-toggle="tooltip" data-placement="bottom"
                                       title="upload file"/>
                    Upload
                </button>
            </div>
        </form>
        
    </div>
</template>

<script>
  let utils = window.web3;
  export default {
      name: "Specification",
      data() {
          return {
              versions: [],
              author: "",
              aml: "",
              version: 0,
              file: "Choose file",
              fileType: "",
              fileObject: null
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
              this.$swarm.downloadEncryptedDoc(this.twinObject.owner, utils.sha3(this.twinObject.deviceId), hash)
                      .then(doc => {
                          vm.aml = doc.content;
                          // highlighting
                      })
          },

          saveAML() {
              let vm = this;
              this.$swarm.uploadEncryptedDoc(
                this.aml,
                'text/plain',
                this.twinObject.owner,//todo replace with deviceagent
                utils.sha3(this.twinObject.deviceId)
              ).then(hash => {
                  vm.specification.addNewAMLVersion.sendTransaction(
                      utils.hexToBytes("0x" + hash),
                      {from: vm.account}
                  ).then(() => {
                      vm.loadVersions();
                  });
              });
          },
          async uploadDocument() {
              if (!this.fileObject) {
                  alert("No file selected");
                  return;
              }
              this.$store.commit('spinner', true);
              let vm = this;
              this.$swarm.uploadDoc(Buffer.from(await this.fileObject.arrayBuffer()), 'text/plain').then(hash => {
                  vm.specification.addNewAMLVersion.sendTransaction(
                          utils.hexToBytes("0x" + hash),
                          {from: vm.account}
                  ).then(() => {
                      vm.loadVersions();
                      this.$store.commit('spinner', false);
                  });
              });
          },
          processFile(event) {
              let file = event.target.files[0];
              if (file.name.length > 29)
                  this.file = file.name.slice(0, 29).concat('...');
              else
                  this.file = file.name.split('.')[0];
              this.fileType = file.type;
              this.fileObject = file;
          }
      },
      async beforeMount() {
          this.$store.commit('spinner', true);
          this.specification = await this.$store.state.contracts.SpecificationContract.at(this.twinAddress);
          await this.loadVersions();
          this.$store.commit('spinner', false);
      },
        mounted() {
          let script = document.createElement('script');
          script.setAttribute('src', 'highlight.pack.js');
          document.head.appendChild(script)
        },
      
  }

</script>

<style scoped>

</style>
