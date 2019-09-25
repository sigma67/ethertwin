<template>
    <div class="container mt-5">
        <div class="row justify-content-sm-center">
        <div class="col-md-9">
            <h3 class="text-center">Add Twin</h3>
            <br/>
            <form class="text-center" @submit.prevent="timestamp">
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
  export default {
    name: "CreateTwin",
    methods: {
      addTwin(){
        
      }
    }
  }
</script>

<style scoped>

</style>