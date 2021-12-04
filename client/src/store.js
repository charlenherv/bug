import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios";
import router from './components/pages/router.js'

Vue.use(Vuex)
Vue.config.devtools = true

export default new Vuex.Store({
  state: {
    currentPlayer: '',
    totalScore: 0,
    leaderBoardEntries: [
      {player: "nobody", score: '000'}
    ],
    scoreSubmitted: false
  },
  mutations: {
    setPlayer: function(state, playerName){
      state.currentPlayer = playerName;
    },
    updateScore: function (state, points) {
      if (points === 'reset') {
        state.totalScore = 0;
      } else {
        state.totalScore += points;
      }
      state.scoreSubmitted = false;
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
      axios.post('/leaderboard').then(response => {
        const entries = response.data.entries;
        commit('updateLeaderBoard', entries);
      });
    },
    addScore: function ({commit}, data) {
      axios.post('/leaderboard',{}, { 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
      },
      params: { player: data.player, score: data.score } }).then(response => {
        const entries = response.data.entries;
        commit('updateLeaderBoard', entries);
      });
    }
  }
})