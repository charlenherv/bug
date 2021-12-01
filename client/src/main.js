import Vue from "vue";
import App from "./App.vue";
import store from "./store.js";
import router from "./components/pages/router.js";

import { defineCustomElements as defineIonPhaser } from '@ion-phaser/core/loader';
Vue.config.ignoredElements = [/ion-\w*/];
defineIonPhaser(window);


Vue.config.productionTip = false;
const app = new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');