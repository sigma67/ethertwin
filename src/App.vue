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
                <router-link to="/" class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Twins</router-link>
              <div class="dropdown-menu" aria-labelledby="navbarDropdown" >
                <router-link :to="{ name: 'twin-spec', params: { twin: twin.deviceId  } }" v-for="twin in twins" v-if="twins.length > 0" class="dropdown-item">{{ twin.deviceName }}</router-link>
              </div>
            </li>
            <li class="nav-item"> <!-- v-if twin selected, show link to documents-->
              <router-link :to="{ name: 'documents'}" class="nav-link">Documents</router-link>
            </li>
            <li class="nav-item"> <!-- v-if twin selected, show link to documents-->
              <router-link :to="{ name: 'sensors' }" class="nav-link">Sensors</router-link>
            </li>
            <li class="nav-item">
              <router-link :to="{ name: 'contracts' }" class="nav-link">Contracts</router-link>
            </li>
          </ul>
        </div>
        <div class="nav-item">
          <button type="button" id="icon" class="btn btn-secondary" data-toggle="tooltip" data-placement="bottom" :title="account">
          </button>
        </div>
      </div>
    </nav>
    <router-view/>
  </div>
</template>
<script>
  const jazzicon = require('jazzicon')
  export default {
    computed: {
      account() {
        return this.$store.state.user.address
      },
      twins() {
        return this.$store.state.twins
      }
    },
    //create user-icon based on their address when component is mounted (DOM-reachable)
    mounted(){
      var address = parseInt(this.$store.state.user.address,16) //hex-user-address to int
      var img = jazzicon(50, Math.round(address))
      document.getElementById("icon").appendChild(img)
    },
    beforeMount() {
      this.$store.dispatch('initContracts').then(() => {
        this.$store.dispatch('loadTwins').then(() => {
          console.log(this.twins);
        });
      });
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
