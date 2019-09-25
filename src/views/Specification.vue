<template>
    <div>
        <p id="detailViewResult" style="display: none;"></p>
        <br/>
        <table class="table">
            <thead>
            <th width="50%" class="text-center" scope="col">
                <p id="textAMLVersion" style="display: none;">Version 1 (17.06.2018 15:45) from
                    : 0x51ada8ef4ca494c6d12c568e808ba6de8acc5f51</p>

            </th>
            <th width="25%" class="text-center" scope="col">
                <div id="optionscontainer"></div>
            </th>
            <th width="25%" class="text-right" scope="col">

                <form class="text-center" @submit.prevent="saveAML">
                    <button id="submitAML" class="btn btn-primary" type="submit"
                            style="text-align: center;display: none;">save changes
                    </button>
                </form>
            </th>

            </thead>
        </table>
        <textarea id="amlResult"
                  style="  resize: none; display: none;border:none; width: 40em; height: 40em;"></textarea>
    </div>
</template>

<script>
  export default {
    name: "Specification",
    props: {
      twin: {
        required: true,
      },
    },
    methods: {
      saveAML() {

      }
    }
  }
</script>

<style scoped>

</style>