<template>
    <div class="container mt-5">
        <div class="row justify-content-sm-center">
        <div class="col-md-9">
            <h3 class="text-center">Add Twin</h3>
            <br/>
            <form class="text-center" @submit.prevent="addTwin">
                <div class="form-group">
                    <label class="text-center" for="twinID">ID</label>
                    <br/>
                    <input class="form-control" type="text" id="twinID" name="twinID"/>
                    <br/>
                    <label class="text-center" for="twinName">Twin Name</label>
                    <br/>
                    <input class="form-control" type="text" id="twinName" name="twinName"/>
                    <br/>
                    <label class="text-center" for="twinName">Public Key of Device Agent</label>
                    <br/>
                    <input class="form-control" type="text" id="publicKeyDeviceAgent" name="publicKeyDeviceAgent"/>
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
                    <textarea v-if="selected == 'Text'" class="form-control" type="text" name="AML" id="twinAML" rows="20"/>
                    <br/>
                </div>
                <button class="btn btn-secondary" type="submit">Add Twin</button>
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
              ]
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
          let deviceID = $("#twinID").val();
          let deviceName = $("#twinName").val();
          let deviceAML = $("#twinAML").val();//todo thes Unterscheidung File/Text
          if (deviceID === "" || deviceName === "" || deviceAML === "") {
            alert("Empty values are not accepted!");
          } else {
            //upload file to swarm and get swarm hash
            this.$swarm.uploadDoc(deviceAML).then(hash => {
              vm.$store.state.contracts.ContractRegistry.deployed()
                .then(function (instance) {
                  return instance.registerContract.sendTransaction(
                    deviceID,
                    deviceName,
                    hash,
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