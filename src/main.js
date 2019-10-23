import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap'
import TruffleContract from '@truffle/contract'
import VueSweetalert2 from 'vue-sweetalert2';
import { library } from '@fortawesome/fontawesome-svg-core'
import {faUserSecret, faTrash, faShareAlt, faSearch, faPlusSquare, faSave, faFileAlt, faFileUpload, faFileDownload, faWifi, faSitemap} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'

library.add(faUserSecret, faTrash, faShareAlt, faSearch, faPlusSquare, faSave, faFileAlt, faFileUpload, faFileDownload,  faWifi, faSitemap)

Vue.component('font-awesome-icon', FontAwesomeIcon)

//plugins
import utils from './plugins/utils'
import swarm from './plugins/swarm'

Vue.use(utils)
Vue.use(swarm)
Vue.use(VueSweetalert2);
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
