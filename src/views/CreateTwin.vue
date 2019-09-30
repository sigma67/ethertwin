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
                    <input class="form-control" type="text" id="twinID" name="twinID"></input>
                    <br/>
                    <label class="text-center" for="twinName">Twin Name</label>
                    <br/>
                    <input class="form-control" type="text" id="twinName" name="twinName"></input>
                    <br/>
                    <label class="text-center" for="twinAML">AML</label>
                    <br/>
                    <textarea class="form-control" type="text" name="AML" id="twinAML" rows="20"></textarea>
                    <br/>
                </div>
                <button class="btn btn-primary" type="submit">Add Twin</button>
            </form>
        </div>
        </div>
    </div>
</template>

<script>
  import $ from 'jquery';

  export default {
    name: "CreateTwin",
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
        let deviceAML = $("#twinAML").val();
        console.log(this.account);
        if (deviceID === "" || deviceName === "" || deviceAML === "") {
          alert("Empty values are not accepted!");
        } else {
          //let devAMLArray = await App.getAMLArray(deviceAML);
          //is waiting until all addresses are stored
          //let waitingFor = await App.registerAMLBodies(deviceAML);
          this.$store.state.contracts.ContractRegistry.deployed()
            .then(function (instance) {
              return instance.registerContract.sendTransaction(
                deviceID,
                deviceName,
                deviceAML,
                {
                  from: vm.account
                }
              );
            })
            .then(function (result) {
              $("#content").show();
              $("#loader").hide();

              //todo redirect to start page
            })
            .catch(function (err) {
              alert(err);
            });
        }
      },

    }
  }
</script>

<style scoped>

</style>