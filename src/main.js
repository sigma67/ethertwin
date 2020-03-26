//VUE
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

//UI
import VueSweetalert2 from 'vue-sweetalert2';
import 'bootstrap'
import { library } from '@fortawesome/fontawesome-svg-core'
import {faUserSecret, faTrash, faShareAlt, faSearch, faPlusSquare, faSave, faFileAlt, faFileUpload, faFileDownload, faWifi, faSitemap, faDatabase, faAddressCard, faHistory, faUserTag, faUserCircle, faProjectDiagram, faLockOpen, faLock} from '@fortawesome/free-solid-svg-icons'
import {faEthereum} from '@fortawesome/free-brands-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/vue-fontawesome'
library.add(faUserSecret, faTrash, faShareAlt, faSearch, faPlusSquare, faSave, faFileAlt, faFileUpload, faFileDownload,  faWifi, faSitemap, faDatabase, faAddressCard, faEthereum, faHistory, faUserTag, faUserCircle, faProjectDiagram, faLockOpen, faLock)
Vue.component('font-awesome-icon', FontAwesomeIcon)

//plugins
import utils from './plugins/utils'
import swarm from './plugins/swarm'

//VUE setup
Vue.use(utils)
Vue.use(VueSweetalert2);
Vue.config.productionTip = false

new Vue({
  router,
  store,
  beforeCreate: function() {
    this.$store.dispatch('setup')
  },
  render: h => h(App)
}).$mount('#app')

//Swarm Plugin depends on initialized Ethereum account in store,
//which happens during Vue instantiation
Vue.use(swarm, store)
