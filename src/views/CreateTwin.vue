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
                        <input v-if="selected == 'File' " type="file" class="form-control-file">
                        <br/>
                        <textarea v-if="selected == 'Text'" class="form-control" type="text" v-model.lazy="twinAML"
                                  id="twinAML" rows="20"/>
                        <br/>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
  import $ from 'jquery';

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
        deviceAgent: ""
      }
    },
    computed: {
      account() {
        return this.$store.state.user.address
      },
    },
    methods: {

      addTwin() {
        let vm = this;
        //todo thes Unterscheidung File/Text
        if (this.twinID === "" || this.twinName === "" || this.twinAML === "" || !web3.utils.isAddress(this.deviceAgent)) {
          alert("Empty values are not accepted!");
        } else {
          //upload file to swarm and get swarm hash
          this.$swarm.uploadDoc(this.twinAML, 'text/plain').then(hash => {
            vm.$store.state.contracts.ContractRegistry.deployed()
              .then(function (instance) {
                return instance.registerContract.sendTransaction(
                  vm.twinID,
                  vm.twinName,
                  web3.utils.hexToBytes("0x" + hash),
                  vm.deviceAgent,
                  {
                    from: vm.account
                  }
                );
              })
              .then(function (result) {
                vm.$store.dispatch('loadTwins');
                vm.$router.push('/');
              })
              .catch(function (err) {
                alert(err);
              });
          });
        }
      },
    }
  }

</script>

<style scoped>

</style>