import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap'
import TruffleContract from '@truffle/contract'


Vue.prototype.$TruffleContract = TruffleContract;

Vue.config.productionTip = false


new Vue({
  router,
  store,
  beforeCreate: function () {
    this.$store.commit('setup');
    this.$store.commit('initContract');
    //todo change to action/dispatch
  },
  render: h => h(App)
}).$mount('#app')
