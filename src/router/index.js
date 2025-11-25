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
      path: "/poll/:id",
      name: "PollView",
      component: () => import("../views/PollView.vue"),
    },
    {
      path: "/lobby/:id",
      name: "LobbyView",
      component: () => import("../views/LobbyView.vue"),
    },
    {
      path: "/create/",
      name: "CreateView",
      component: () => import("../views/CreateView.vue"),
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
      component: () => import("../views/minigames/RacingView.vue"),
    },
    {
      path: "/controller/",
      name: "RacingControllerView",
      component: () => import("../views/minigames/RacingControllerView.vue"),
    },
    {
      path: "/minigame/",
      name: "MinigameView",
      component: () => import("../views/minigames/MinigameView.vue"),
    },
  ],
});

export default router;
