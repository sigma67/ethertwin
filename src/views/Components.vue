<template>
  <div class="container mt-5">
    <h2>Components of Twin: <small class="text-muted">{{ twinObject.deviceName }}</small></h2><br/>

    <br/>
    <div v-for="(component,i) in twinObject.components" class="card">

      <div class="card-header" id="headingOne">
        <h5 class="mb-0">
          <button class="btn btn-link" type="button" data-toggle="collapse" :data-target="'#component'+i"
                  aria-expanded="false" :aria-controls="'component'+i"
                  v-on:click="parseComponent(component.id, 'component'+i)">
            <font-awesome-icon icon="sitemap" data-toggle="tooltip" data-placement="bottom"
                               :title="'component: '+ component.id"/>
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
                specification: ""
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
            async parseComponent(componentId, htmlElement) {
                //check if elements are already appended
                if (document.getElementById(htmlElement).innerHTML.indexOf("ul") === -1) {
                //parse aml to get the relevant components: componentIndex
                let parser = new DOMParser();
                let amlDoc = parser.parseFromString(this.specification, "text/xml");
                let instanceHierarchy = amlDoc.documentElement.getElementsByTagName("InstanceHierarchy");
                let childNodes = instanceHierarchy[0].children;
                let component;
                //search for the right component
                for (let i = 0; i < childNodes.length; i++) {
                    //all children of type "InternalElement" are high-level components 
                    if (childNodes[i].nodeName === "InternalElement" && childNodes[i].getAttribute("ID") === componentId) {
                        component = childNodes[i];
                    }
                }
                let htmlText = "<div class=\"card card-body\">Elements: <ul>";
                for (let i = 0; i < component.children.length; i++) {
                    if (component.children[i].nodeName === "InternalElement") {
                        let component_id = component.children[i].getAttribute("ID");
                        let component_name = component.children[i].getAttribute("Name");
                        htmlText += "<li>" + component_name + " (" + component_id + ") </li>";
                    }
                }
                document.getElementById(htmlElement).innerHTML += htmlText + "</ul></div>";
                }
            }
        },
        async beforeMount() {
            let length = await this.twinObject.specification.getAMLCount();
            let index = length.toNumber() - 1;

            //get latest version of specification-AML
            let amlInfo = await this.twinObject.specification.getAML(index);
            //get AML from Swarm using aml-hash
            this.specification = await this.$swarm.downloadDoc(this.$utils.hexToSwarmHash(amlInfo.hash));
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