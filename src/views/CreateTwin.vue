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
            <label class="text-center" for="twinName">Twin Name</label>
            <br/>
            <input class="form-control" type="text" id="twinName" v-model.lazy="twinName"/>
            <br/>
            <label class="text-center" for="twinName">Device Agent address</label>
            <br/>
            <input class="form-control" type="text" id="publicKeyDeviceAgent" v-model.lazy="deviceAgent"/>
            <br/>
            <label class="text-center" for="twinAML">AML</label>
            <br/>
            <select v-model="selected" class="form-control">
              <option disabled value="pleaseSelect">Please select</option>
              <option v-for="option in options" v-bind:value="option.value" v-bind:key="option.text">
                {{ option.text }}
              </option>
            </select>
            <br/>
            <input v-if="selected === 'File' " type="file" class="form-control-file" @change="processFile">
            <br/>
            <textarea v-if="selected === 'Text'" class="form-control" type="file" v-model.lazy="twinAML"
                      id="twinAML" rows="20" @change="processFile"></textarea>
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

            async addTwin() {
                let vm = this;

                if (this.twinName === "" || this.twinAML === "" && this.selected === "Text" ) {
                    alert("Empty values are not accepted!");
                }
                this.$store.commit('spinner', true)
                let key = this.$swarm.createFileKey();
                let swarmHash = await this.$swarm.encryptAndUpload(this.twinAML, 'text/plain', key);
                let receipt = await vm.$store.state.contracts.ContractRegistry.registerContract(
                    vm.twinName,
                    this.$utils.swarmHashToBytes(swarmHash),
                    vm.deviceAgent,
                    {
                        from: vm.account
                    }
                )
                await this.$swarm.shareFileKey(
                        this.account,
                        window.web3.utils.sha3(receipt.logs[0].args.contractAddress),
                        this.deviceAgent,
                        key,
                        this.$swarm.encryptKeyForSelf(key)
                );
                vm.$store.dispatch('loadTwins');
                vm.$router.push('/');
                vm.$store.commit('spinner', false);
            },
            async processFile(event) {
                try {
                    if (this.selected === 'File') {
                        this.twinAML = Buffer.from(await event.target.files[0].arrayBuffer());
                    }
                } catch (error) {
                  console.log(error);
                }

            }
        },
        beforeMount(){
          this.deviceAgent = "0x472c27020ed212627d3087ad546e21d220fb1c49"//this.account;
        }
    }

</script>

<style scoped>

</style>
