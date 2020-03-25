import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Account from "./views/Account";
import CreateTwin from './views/CreateTwin.vue'
import Specification from './views/Specification.vue'
import Sensors from './views/Sensors.vue'
import Sensor from './views/Sensor.vue'
import Documents from './views/Documents.vue'
import Roles from './views/Roles.vue'
import AddSensor from "./views/AddSensor";
import Components from "./views/Components";
import Sources from "./views/Sources";

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  linkActiveClass: "active",
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/account',
      name: 'account',
      component: Account,
      props: true
    },
    {
      path: '/twin/:twin/users',
      name: 'roles',
      component: Roles,
      props: true
    },
    {
      path: '/twin/:twin/components',
      name: 'components',
      component: Components,
      props: true
    },
    {
      path: '/twin/create',
      name: 'twin-create',
      component: CreateTwin,
      props: true
    },
    {
      path: '/twin/:twin/specification',
      name: 'twin-spec',
      component: Specification,
      props: true
    },
    {
      path: '/twin/:twin/sensors/add',
      name: 'sensor-add',
      component: AddSensor,
      props: true
    },
    {
      path: '/twin/:twin/sensors',
      name: 'sensors',
      component: Sensors,
      props: true
    },
    {
      path: '/twin/:twin/sensors/:component/:sensor',
      name: 'sensor',
      component: Sensor,
      props: true
    },
    {
      path: '/twin/:twin/documents',
      name: 'documents',
      component: Documents,
      props: true
    },
    {
      path: '/twin/:twin/sources',
      name: 'sources',
      component: Sources,
      props: true
    },
  ]
})
