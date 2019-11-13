<template>
  <div id="app">
    <nav class="navbar navbar-expand-md navbar-light bg-light">
      <div class="container">
        <router-link to="/"  class="navbar-brand">
          <img alt="UR Logo" src="./assets/logo.png" height="36" class="align-middle mr-2">
          Ether Twin
        </router-link>

        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar" aria-controls="navbar" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"/>
        </button>

        <div id="navbar" class="collapse navbar-collapse">
          <ul class="navbar-nav">
            <li class="nav-item dropdown">
                <a href="" class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Twins</a>
              <div class="dropdown-menu" aria-labelledby="navbarDropdown" >
                <router-link :to="{ name: 'components', params: { twin: twin.deviceId  } }" v-for="twin in twins" v-if="twins.length > 0" class="dropdown-item">{{ twin.deviceName }}</router-link>
              </div>
            </li>
            <template v-if="selectedTwin !== 0">
              <li class="nav-item"> <!-- v-if twin selected, show link to twin overview-->
                <router-link :to="{ name: 'components', params: { twin: selectedTwin  }}" class="nav-link">Components</router-link>
              </li>
              <li class="nav-item"> 
                <router-link :to="{ name: 'twin-spec', params: { twin: selectedTwin  }}" class="nav-link">Specification</router-link>
              </li>
              <li class="nav-item"> 
                <router-link :to="{ name: 'documents', params: { twin: selectedTwin  }}" class="nav-link">Documents</router-link>
              </li>
              <li class="nav-item"> 
                <router-link :to="{ name: 'sensors', params: { twin: selectedTwin  }}" class="nav-link">Sensors</router-link>
              </li>
              <li class="nav-item">
                <router-link :to="{ name: 'sources', params: { twin: selectedTwin  }}" class="nav-link">Data sources</router-link>
              </li>
              <!--<li class="nav-item">
                <router-link :to="{ name: 'programs', params: { twin: selectedTwin  }}" class="nav-link">Programs</router-link>
              </li>-->
            </template>
            <template v-if="isOwner == true">
              <li class="nav-item" v-if="true">
                <router-link :to="{ name: 'roles', params: { twin: selectedTwin  }}" class="nav-link">Users</router-link>
              </li>
            </template>
          </ul>
        </div>
        <div class="nav-item">
          <button type="button" id="icon" class="btn btn-secondary" data-toggle="tooltip" data-placement="bottom" :title="account" @click="$router.push('/account')">
          </button>
        </div>
      </div>
    </nav>
    <router-view/>
    <spinner :visible="spinner"/>

  </div>
</template>
<script>
  import Spinner from './components/Spinner.vue'
  const jazzicon = require('jazzicon')
  import registryAbi from '../public/contracts/ContractRegistry.json'
  import authorizationAbi from '../public/contracts/Authorization.json'
  import specificationAbi from '../public/contracts/Specification.json'
  let crypto = require('crypto')
  
  export default {
    components: {
      Spinner
    },
    data(){
      return {
        twin: null,
      }
    },
    computed: {
      account() {
        return this.$store.state.user.address
      },
      spinner(){
        return this.$store.state.spinner
      },
      selectedTwin(){
        return this.$store.state.selectedTwin
      },
      twins() {
        return this.$store.state.twins
      },
      isOwner() {
         let twinID= this.$store.state.selectedTwin;
         for(let i=0; i< this.$store.state.twins.length; i++){
             if(this.$store.state.twins[i].deviceId === twinID && this.$store.state.twins[i].role === "Owner") return true
         }
        }
    },

    async beforeCreate() {
      let ABIs = {
        registry: registryAbi,
        authorization: authorizationAbi,
        specification: specificationAbi
      };

      // let publicKey = this.$store.state.user.wallet.getPublicKey().toString('hex');
      // let privateKey = this.$store.state.user.wallet.getPrivateKey().toString('hex');
      // let fileKey = crypto.randomBytes(32);
      // let ciphertext = this.$crypto.encryptECIES(publicKey, fileKey.toString('hex'));
      // let plaintext = this.$crypto.decryptECIES(privateKey, ciphertext)
      // let key = new Buffer(plaintext, 'hex');
      // let docEncrypt = this.$crypto.encryptAES('s3cret', key) //returns a js object with ciphertext, key, iv
      // let doc = this.$crypto.decryptAES(docEncrypt.encryptedData, key, docEncrypt.iv)
      // console.log(doc)

      if(!this.$store.state.contracts.hasOwnProperty("Authorization")) {
        this.$store.commit('setSpecificationAbi', ABIs.specification);
        await this.$store.dispatch('initContracts', ABIs);
      }

      await this.$store.dispatch('loadTwins');
      //create user-icon based on their address when component is mounted (DOM-reachable)
      let address = parseInt(this.account,16); //hex-user-address to int
      let img = jazzicon(50, Math.log(address));
      document.getElementById("icon").appendChild(img);

      this.$store.commit('spinner', false);
    }
  }
</script>


<style>
@import'~bootstrap/dist/css/bootstrap.css';
@import '~sweetalert2/dist/sweetalert2.min.css';

#icon {
  background-color: transparent;
  border-color: transparent;
}

</style>
