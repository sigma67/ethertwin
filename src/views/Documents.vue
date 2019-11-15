<template>
    <div class="container mt-5">
        <h2>Documents for Twin: <small class="text-muted">{{ twinObject.deviceName }}</small></h2><br/>
        <h5>Add new documents</h5>
        <p>Select a component and choose a file to add a new document.</p>
        <form class="row" @submit.prevent="uploadDocument">
            <div class="col">
                <div class="row">
                    <div class="form-group col-md-3">
                        <select id="component" class="form-control" v-model="selectedComponent">
                            <option v-for="component in twinObject.components" v-bind:value="component.id">{{
                                component.name }}
                            </option>
                        </select>
                    </div>
                    <div class="input-group mb-3 col">
                        <div class="custom-file">
                            <input type="file" class="custom-file-input" id="inputGroupFile01" @change="processFile">
                            <label class="custom-file-label" for="inputGroupFile01">{{ file }} {{ fileType ? '(' +
                                fileType + ')' : '' }}</label>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="form-group col">
                        <input type="text" class="form-control" placeholder="Description" aria-label="description"
                               v-model.lazy="description">
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

        <hr/>
        <h5>Existing Documents</h5><br />
        <div class="row">
        </div>

        <div v-for="component in components">
            <template v-if="component.documents && component.documents.length > 0">
                <strong>{{ component.name }}</strong>
                <hr/>
                <div class="col-sm-5" v-for="(document, i) in component.documents">
                    <div class="card mb-4">
                        <div class="card-body">
                            <p class="card-title">{{ document[0] }}</p>
                            <p class="card-text">{{ document[1] }}</p>
                            <select id="document" class="form-control mb-3" v-model="document.selectedVersion">
                                <option v-for="(version, j) in document[2]" v-bind:value="j">Version {{
                                    document[2].length - j }} ({{$utils.date(version[0])}})
                                </option>
                            </select>
                            <div class="row">
                                <div class="col">
                                    <a href="#" class="btn btn-primary btn-block"
                                       v-on:click.prevent="addDocumentVersion(component.id, i)">
                                        <font-awesome-icon icon="plus-square" data-toggle="tooltip"
                                                           data-placement="bottom" title="upload file"/>
                                        Add Version
                                    </a>
                                </div>
                                <div class="col">
                                    <a href="#" class="btn btn-primary btn-block"
                                       v-on:click.prevent.stop="downloadDocument(document[2][document.selectedVersion][2], document[0], component.id)">
                                        <font-awesome-icon icon="file-download" data-toggle="tooltip"
                                                           data-placement="bottom" title="upload file"/>
                                        Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>

    </div>
</template>

<script>
  import $ from 'jquery'

  export default {
    name: "Documents.vue",
    data() {
      return {
        components: [],
        selectedComponent: "",
        file: "Choose file",
        fileType: "",
        description: "",
        fileObject: null
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
      twins() {
        return this.$store.state.twins
      },
      twinObject() {
        return this.$store.state.twins
          .filter(f => f.deviceId === this.twin)[0];
      },
    },
    props: {
      twin: {
        required: true,
      },
    },
    methods: {
      processFile(event) {
        let file = event.target.files[0];

        if (file.name.length > 29)
          this.file = file.name.slice(0, 29).concat('...');
        else
          this.file = file.name.split('.')[0]

        this.fileType = file.type;
        this.fileObject = file;
      },

      async getFileKey(component){
        // //todo: done by device agent. until then, run once to upload files
        // let crypto = require('crypto')
        // let key = crypto.randomBytes(32);
        // let publicKey = this.$store.state.user.wallet.getPublicKey().toString('hex');
        // let ciphertext = this.$crypto.encryptECIES(publicKey, key.toString('base64'));
        // let update = [{address: this.account, fileKey: ciphertext}];
        let feed = {
          user: this.account,//this.twinObject.address,
          topic: web3.utils.sha3(component)
        };
        // await this.$swarm.updateFeedSimple(feed, update);

        //get file key from device agent feed
        let fileKeys = await this.$swarm.getUserFeedLatest(feed.user, feed.topic);console.log(fileKeys);
        let keyObject = fileKeys.filter(f => f.address === this.account)[0];
        let privateKey = this.$store.state.user.wallet.getPrivateKey().toString('hex');
        let plainKey = this.$crypto.decryptECIES(privateKey, keyObject.fileKey)
        return new Buffer(plainKey, 'base64');
      },

      async uploadDocument() {
        if (!this.fileObject) {
          alert("No file selected");
          return;
        }
        this.$store.commit('spinner', true);

        let plaintext = Buffer.from(await this.fileObject.arrayBuffer());

        //Get file key and encrypt
        let fileKey = await this.getFileKey(this.selectedComponent);
        let cipherText = this.$crypto.encryptAES(plaintext, fileKey);
        cipherText.contentType = this.fileObject.type;

        //upload to Swarm and add to blockchain
        let hash = await this.$swarm.uploadDoc(JSON.stringify(cipherText), "application/json");
        await this.specification.addDocument(
          this.selectedComponent,
          this.fileObject.name,
          this.description,
          this.$utils.swarmHashToBytes(hash),
          {from: this.account}
        );

        //reload documents
        await this.loadDocuments();
        this.$store.commit('spinner', false);
      },

      async downloadDocument(hash, filename, component) {
        this.$store.commit('spinner', true);
        let fileKey = await this.getFileKey(component);
        let response = await this.$swarm.downloadDoc(this.$utils.hexToSwarmHash(hash), 'json');
        let plaintext = this.$crypto.decryptAES(response.encryptedData, fileKey, response.iv)
        let blob = new Blob([plaintext], {type: response.contentType})
        let link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        this.$store.commit('spinner', false);
      },

      async addDocumentVersion(componentId, version) {
        let vm = this;
        let result = await this.$swal({
          title: "Add new document version",
          confirmButtonClass: "confirm-class",
          cancelButtonClass: "cancel-class",
          showCancelButton: true,
          reverseButtons: true,
          html:
            "<p>You can add another document version.</p>" +
            "</br>" +
            "<h5>File</h5><br/>" +
            '<input type="file" class="form-control-file text-center" id="swal-input1">'
        });
        if (result.value) {
          let files = $("#swal-input1").prop('files');
          if (files.length === 0) return;
          let file = files[0];

          let hash = await this.$swarm.uploadDoc(
            Buffer.from(await file.arrayBuffer()),
            file.type
          );
          await this.specification.addDocumentVersion(
            componentId,
            version,
            this.$utils.swarmHashToBytes(hash),
            {from: vm.account}
          );
          this.loadDocuments();
        }
      },

      async getDocumentCounts(component) {
        return {
          id: component.id,
          name: component.name,
          count: (await this.specification.getDocumentCount(component.id)).toNumber()
        };
      },

      async loadDocuments() {
        this.$store.commit('spinner', true);
        let components = await Promise.all(this.twinObject.components.map(this.getDocumentCounts));

        for (let i = 0; i < components.length; i++) {
          components[i].documents = [];
          for (let j = 0; j < components[i].count; j++) {
            let document = await this.specification.getDocument(components[i].id, j);
            document.selectedVersion = 0;
            document[2] = document[2].reverse();
            components[i].documents.push(document);
          }
        }
        this.components = components;
        this.$store.commit('spinner', false);
      }

    },

    async beforeMount() {
      if (this.twinObject.components && this.twinObject.components.length > 0) {
        this.loadDocuments();
        this.selectedComponent = this.twinObject.components[0].id;
        console.log(await this.getFileKey())
      }
      this.$store.subscribe((mutation, state) => {
        if (mutation.type === "addTwinComponents" && mutation.payload.components.length > 0) {
          this.loadDocuments();
          this.selectedComponent = mutation.payload.components[0].id;
        }
      })
    },

  }

</script>

<style scoped>
    .card-title {
        font-weight: bold;
    }
</style>