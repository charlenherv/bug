<template>
  <div id="app" ref="app">
    <router-view></router-view>
  </div>
</template>

<script>
import Vue from 'vue'
import VueRouter from 'vue-router'
Vue.use(VueRouter);
import routes from './components/pages/routes.js'

export default {
  name: 'App',
  components: {
  },
  methods: { 
  },
  data(){
    return {
    }
  },
  mounted(){
    
  }
}
</script>

<style lang="scss">
  html,
  body {
    padding: 0;
    margin: 0;
    height: 100%;
  }
  #app {
    height: 100%;
    width: 100%;
  }
</style>
