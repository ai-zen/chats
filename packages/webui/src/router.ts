import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/chat",
    component: () => import("./views/chat/index.vue"),
    meta: { title: "聊天" },
  },
  {
    path: "/scene/list",
    component: () => import("./views/scene/list/index.vue"),
    meta: { title: "场景列表" },
  },
  {
    path: "/scene/form",
    component: () => import("./views/scene/form/index.vue"),
    meta: { title: "编辑场景" },
  },
  {
    path: "/agent/list",
    component: () => import("./views/agent/list/index.vue"),
    meta: { title: "代理列表" },
  },
  {
    path: "/agent/form",
    component: () => import("./views/agent/form/index.vue"),
    meta: { title: "编辑代理" },
  },
  {
    path: "/tool/list",
    component: () => import("./views/tool/list/index.vue"),
    meta: { title: "工具列表" },
  },
  {
    path: "/tool/form",
    component: () => import("./views/tool/form/index.vue"),
    meta: { title: "编辑工具" },
  },
  {
    path: "/knowledge-base/list",
    component: () => import("./views/knowledge-base/list/index.vue"),
    meta: { title: "知识库列表" },
  },
  {
    path: "/knowledge-base/form",
    component: () => import("./views/knowledge-base/form/index.vue"),
    meta: { title: "编辑知识库" },
  },
  {
    path: "/knowledge-base/data",
    component: () => import("./views/knowledge-base/data/index.vue"),
    meta: { title: "录入知识库" },
  },
  {
    path: "/endpoint/list",
    component: () => import("./views/endpoint/list/index.vue"),
    meta: { title: "服务端列表" },
  },
  {
    path: "/endpoint/form",
    component: () => import("./views/endpoint/form/index.vue"),
    meta: { title: "编辑服务端" },
  },
  {
    path: "/",
    redirect: "/chat",
  },
];

const router = createRouter({
  routes: routes,
  history: createWebHistory(),
});

router.beforeEach((to) => {
  if (typeof to.meta?.title == "string") document.title = to.meta.title;
});

export default router;
