<template>
  <div class="container mt-5">
    <h2>Components of Twin: <small class="text-muted">{{ twinObject.deviceName }}</small></h2><br/>

    <br/>
     <div v-for="component in twinComponents" v-if="twinComponents.length > 0" class="card">

       <div class="card-header" id="headingOne">
         <h5 class="mb-0">
           <button class="btn btn-link" type="button" data-toggle="collapse" :data-target="'#'+component.name" aria-expanded="false" :aria-controls="component.name">
             <font-awesome-icon icon="sitemap" data-toggle="tooltip" data-placement="bottom" :title="'component: '+component.id"/>
             {{ component.name }}
         </button>
         </h5>
       </div>
       <div class="collapse" :id="component.name">
         <div class="card card-body">
           ID : {{ component.id }}
         </div>
       </div>

     </div>

  </div>

</template>

<script>
    export default {
        name: "TwinOverview.vue",
        data() {
            return {
                msg: "", 
            }
        },
        computed: {
            twinObject() {
                return this.$store.state.twins
                    .filter(f => f.deviceId === this.twin)[0];
            }, 
            twinComponents(){
                return this.twinObject.components;
            }
        },
        props: {
            twin: {
                required: true,
            },
        },
        methods: {}
    }
</script>

<style scoped>

</style>