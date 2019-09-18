import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

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
      path: '/contracts',
      name: 'contracts',
      component: () => import(/* webpackChunkName: "about" */ './views/Contracts.vue')
    },
    {
      path: '/twin/:twin',
      name: 'twin',
      component: Home,
      props: true
    },
    {
      path: '/twin/:twin/sensor/:sensor',
      name: 'sensor',
      component: Home,
      props: true
    },
  ]
})
