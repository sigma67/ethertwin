<template>
    <div class="container mt-5">
        <h2>Documents for Twin: <small class="text-muted">{{ twinObject.deviceName }}</small></h2><br />
        <h5>Add new documents</h5>
        <p>Select a component and choose a file to add a new document.</p>
        <form class="row" @submit.prevent="uploadDocument">
            <div class="col">
                <div class="row">
                    <div class="form-group col-md-3">
                        <select id="component" class="form-control" v-model="selectedComponent">
                            <option v-for="component in components" v-bind:value="component.id">{{ component.name }}</option>
                        </select>
                    </div>
                    <div class="input-group mb-3 col">
                        <div class="custom-file">
                            <input type="file" class="custom-file-input" id="inputGroupFile01" @change="processFile">
                            <label class="custom-file-label" for="inputGroupFile01">{{ file }} {{ fileType ? '(' + fileType + ')' : '' }}</label>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="form-group col">
                        <input type="text" class="form-control" placeholder="Description" aria-label="description" v-model.lazy="description">
                    </div>
                </div>
            </div>
            <div class="form-group col-md-2">
            <button id="upload" class="btn btn-secondary btn-block h-100">
                <font-awesome-icon icon="file-upload" data-toggle="tooltip" data-placement="bottom" title="upload file"/>
                Upload
            </button>
            </div>
        </form>

        <hr/>
        <h5>Existing documents</h5>
        <div class="row">
            <div class="col-sm-5" v-for="(document, i) in documents">
                <div class="card mb-4">
                    <div class="card-body">
                        <p class="card-title">{{ document[0] }}</p>
                        <p class="card-text">{{ document[1] }}</p>
                        <select id="document" class="form-control mb-3" v-model="document.selectedVersion">
                            <option v-for="(version, j) in document[2]" v-bind:value="j">Version {{ document[2].length - j }} ({{$utils.date(version[0])}})</option>
                        </select>
                        <div class="row">
                        <div class="col">
                            <a href="#" class="btn btn-primary btn-block" v-on:click.prevent="addDocumentVersion(i)">
                            <font-awesome-icon icon="plus-square" data-toggle="tooltip" data-placement="bottom" title="upload file"/>
                            Add Version
                            </a>
                        </div>
                            <div class="col">
                                <a href="#" class="btn btn-primary btn-block" v-on:click.prevent.stop="downloadDocument(document[2][document.selectedVersion][2], document[0])">
                                    <font-awesome-icon icon="file-download" data-toggle="tooltip" data-placement="bottom" title="upload file"/>
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
  import $ from 'jquery'
  export default {
    name: "Documents.vue",
    data() {
      return {
        components: [
          {name: "HMI", id: "068ec45a-1002-4a75-8e27-21d8e0da6e3d"},
          {name: "PLC", id: "27e368a1-3845-47ee-97ba-48de151e90bc"}
        ],
        selectedComponent: "068ec45a-1002-4a75-8e27-21d8e0da6e3d",
        documents: [],
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
      twinAddress() {
        return this.twinObject.address;
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
      processFile(event){
        let file = event.target.files[0];

        if(file.name.length > 29)
          this.file = file.name.slice(0, 29).concat('...');
        else
          this.file = file.name.split('.')[0]

        this.fileType = file.type;
        this.fileObject = file;
      },

      async uploadDocument() {
        if(!this.fileObject){
          alert("No file selected");
          return;
        }
        let hash = await this.$swarm.uploadDoc(
          Buffer.from(await this.fileObject.arrayBuffer()),
          this.fileObject.type
        );
        await this.specification.addDocument(
          this.selectedComponent,
          this.fileObject.name,
          this.description,
          this.$utils.swarmHashToBytes(hash),
          { from: this.account }
        );
        await this.loadDocuments();
      },

      async downloadDocument(hash, filename) {
        console.log(hash)
        console.log(filename)
        let response = await this.$swarm.downloadDoc(this.$utils.hexToSwarmHash(hash), 'file');
        let contentType = response.headers.get("content-type");
        let blob = new Blob([await response.arrayBuffer()], { type: contentType })
        let link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
      },

      async addDocumentVersion(version) {
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
            if(files.length === 0) return;
            let file = files[0];

            let hash = await this.$swarm.uploadDoc(
              Buffer.from(await file.arrayBuffer()),
              file.type
            );
            await this.specification.addDocumentVersion(
              this.components[0].id, //todo replace with actual component -> match component hash to find component id
              version,
              this.$utils.swarmHashToBytes(hash),
              { from: vm.account }
            );
          }
      },

      async loadDocuments() {
        let count = await this.specification.getDocumentCount(this.components[0].id);
        for(let i = 0; i < count.toNumber(); i++){
          let document = await this.specification.getDocument(this.components[0].id, i);
          document.selectedVersion = 0;
          document[2] = document[2].reverse();
          this.documents.push(document);
        }
      }
    },

    async beforeMount() {
      this.specification = await this.$store.state.contracts.SpecificationContract.at(this.twinAddress);
      await this.loadDocuments();
    }

  }

</script>

<style scoped>
.card-title{
    font-weight: bold;
}
</style>