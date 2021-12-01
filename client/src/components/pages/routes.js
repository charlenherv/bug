import Game from '@/components/pages/Game.vue';

const routes = [
    { path: '/', redirect: '/game' },
    { 
      name: 'Game',
      path: '/game',
      component: Game,
      props: true
    }
  ]

export default routes;