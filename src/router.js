import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import CreateTwin from './views/CreateTwin.vue'
import Specification from './views/Specification.vue'
import Sensors from './views/Sensors.vue'
import Sensor from './views/Sensor.vue'
import Documents from './views/Documents.vue'
import Roles from './views/Roles.vue'
import AddSensor from "./views/AddSensor";
import TwinOverview from "./views/TwinOverview";

Vue.use(Router);

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/twin/:twin/overview',
      name: 'twinOverview',
      component: TwinOverview,
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
      path: '/twin/:twin/roles',
      name: 'twin',
      component: Roles,
      props: true
    },
  ]
})
