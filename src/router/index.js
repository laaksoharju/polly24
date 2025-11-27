import { createRouter, createWebHistory } from "vue-router";
import StartView from "../views/StartView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "Start",
      component: StartView,
    },

    {
      path: "/lobby/:id",
      name: "LobbyView",
      component: () => import("../views/LobbyView.vue"),
    },

    {
      path: "/result/:id",
      name: "ResultView",
      component: () => import("../views/ResultView.vue"),
    },
    {
      path: "/test/",
      name: "TestView",
      component: () => import("../views/TestView.vue"),
    },
    {
      path: "/slot/",
      name: "SlotView",
      component: () => import("../views/SlotView.vue"),
    },
    {
      path: "/bowling/",
      name: "BowlingView",
      component: () => import("../views/minigames/BowlingView.vue"),
    },
    {
      path: "/racing/",
      name: "RacingView",
      component: () => import("../views/minigames/racing/RacingView.vue"),
    },
    {
      path: "/controller/",
      name: "RacingControllerView",
      component: () => import("../views/minigames/racing/RacingControllerView.vue"),
    },
    {
      path: "/game/",
      name: "GameView",
      component: () => import("../views/GameView.vue"),
    },
  ],
});

export default router;
