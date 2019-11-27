<template>
  <div class="container mt-5">
    <div class="row justify-content-sm-center">
      <div class="col-md-9">
        <h3 class="text-center">Add Twin</h3>
        <br/>
        <form class="text-center" @submit.prevent="addTwin">
          <button class="btn btn-secondary btn-block" type="submit">Add Twin</button>
          <br/>
          <div class="form-group">
            <label class="text-center" for="twinID">ID</label>
            <input class="form-control" type="text" id="twinID" v-model.lazy="twinID"/>
            <br/>
            <label class="text-center" for="twinName">Twin Name</label>
            <br/>
            <input class="form-control" type="text" id="twinName" v-model.lazy="twinName"/>
            <br/>
            <label class="text-center" for="twinName">Public Key of Device Agent</label>
            <br/>
            <input class="form-control" type="text" id="publicKeyDeviceAgent" v-model.lazy="deviceAgent"/>
            <br/>
            <label class="text-center" for="twinAML">AML</label>
            <br/>
            <select v-model="selected" class="form-control">
              <option disabled value="pleaseSelect">Please select</option>
              <option v-for="option in options" v-bind:value="option.value">
                {{ option.text }}
              </option>
            </select>
            <br/>
            <input v-if="selected == 'File' " type="file" class="form-control-file" @change="processFile">
            <br/>
            <textarea v-if="selected == 'Text'" class="form-control" type="file" v-model.lazy="twinAML"
                      id="twinAML" rows="20" @change="processFile"/>
            <br/>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
    export default {
        name: "CreateTwin",
        data() {
            return {
                selected: 'Text',
                options: [
                    {text: 'File', value: 'File'},
                    {text: 'Text', value: 'Text'}
                ],
                twinID: "",
                twinName: "",
                twinAML: "",
                deviceAgent: "",
            }
        },
        computed: {
            account() {
                return this.$store.state.user.address
            }
        },
        methods: {

            addTwin() {
                let vm = this;

                if (this.twinID === "" || this.twinName === "" || this.twinAML === "" && this.selected === "Text" ) { //|| !web3.utils.isAddress(this.deviceAgent)
                    alert("Empty values are not accepted!");
                } else {

                    this.$store.commit('spinner', true);
                    //upload file to swarm and get swarm hash
                    let feed = {user: this.account, topic: web3.utils.sha3(vm.twinID)}
                    let hash = this.$swarm.uploadEncryptedDoc(
                            this.twinAML, 'text/plain', this.account,
                            web3.utils.sha3(vm.twinID), true, this.deviceAgent);

                    hash.then(hash => {
                        vm.$store.state.contracts.ContractRegistry.registerContract(
                            vm.twinID,
                            vm.twinName,
                            web3.utils.hexToBytes("0x" + hash),
                            vm.deviceAgent,
                            {
                                from: vm.account
                            }
                        )
                        .then(function (result) {
                            vm.$store.commit('spinner', false);
                            vm.$store.dispatch('loadTwins');
                            vm.$router.push('/');
                        })
                        .catch(function (err) {
                            vm.$store.commit('spinner', false);
                            alert(err);
                        });
                    });
                }
            },
            async processFile(event) {
                try {
                    if (this.selected == 'File') {
                        this.twinAML = Buffer.from(await event.target.files[0].arrayBuffer());
                    }
                } catch (error) {
                  console.log(error);
                }

            }
        },
        beforeMount(){
          this.deviceAgent = this.account;
        }
    }

</script>

<style scoped>

</style>