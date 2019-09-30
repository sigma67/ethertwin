import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap'
import TruffleContract from '@truffle/contract'

//plugins
import utils from './plugins/utils'
import swarm from './plugins/swarm'

Vue.use(utils)
Vue.use(swarm)
Vue.prototype.$TruffleContract = TruffleContract;

Vue.config.productionTip = false

new Vue({
  router,
  store,
  beforeCreate: function() {
    this.$store.dispatch('setup')
  },
  render: h => h(App)
}).$mount('#app')
