import Vue from 'vue';
import VueRouter from 'vue-router';
Vue.use(VueRouter);
import routes from '@/components/pages/routes.js';

const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})

export default router;