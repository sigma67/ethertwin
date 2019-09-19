import Vue from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap'
import blockchain from './plugins/blockchain'
import TruffleContract from '@truffle/contract'
//Object.defineProperty(Vue.prototype, '$TruffleContract', {value: TruffleContract});

Vue.prototype.$TruffleContract = TruffleContract;

Vue.config.productionTip = false

Vue.use(blockchain);



new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
