<template>
  <div class="container mt-5">
    <h2>Components of Twin: <small class="text-muted">{{ twinObject.deviceName }}</small></h2><br/>

    <br/>
     <div v-for="(component,i) in twinObject.components" class="card">

       <div class="card-header" id="headingOne">
         <h5 class="mb-0">
           <button class="btn btn-link" type="button" data-toggle="collapse" :data-target="'#component'+i" aria-expanded="false" :aria-controls="'component'+i">
             <font-awesome-icon icon="sitemap" data-toggle="tooltip" data-placement="bottom" :title="'component: '+component.id"/>
             {{ component.name }}
         </button>
         </h5>
       </div>
       <div class="collapse" :id="'component'+i">
         <div class="card card-body">
           ID : {{ component.id }}
         </div>
       </div>

     </div>

  </div>

</template>

<script>
    export default {
        name: "Components.vue",
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
        },
        props: {
            twin: {
                required: true,
            },
        },
        methods: {

        },
        beforeMount() {
          this.$store.subscribe((mutation, state) => {
            if (mutation.type === "addTwinComponents") {
              console.log(this.twinObject.components)
              this.$forceUpdate();
            }
          })
        }
    }
</script>

<style scoped>

</style>