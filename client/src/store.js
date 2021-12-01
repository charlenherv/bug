import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios";
import router from './components/pages/router.js'

Vue.use(Vuex)
Vue.config.devtools = true

export default new Vuex.Store({
  state: {
    totalScore: 0,
    leaderBoardEntries: [
      {user: "nobody", score: '000'}
    ]
  },
  mutations: {
    updateScore: function (state, points) {
      if (points === 'reset') {
        state.totalScore = 0;
      } else {
        state.totalScore += points;
      }
    },
    updateLeaderBoard: function (state, entries) {
      state.leaderBoardEntries = entries;
    }
  },
  actions: {
    updateScore: function ({commit}, points) {
      commit('updateScore', points)
    },
    getLeaderBoard: function ({commit}) {
      /*axios.get('/getLeaderboard').then(response => {
        const entries = response.data.entries;
        commit('updateLeaderBoard', entries);
      });*/
    }
  }
})