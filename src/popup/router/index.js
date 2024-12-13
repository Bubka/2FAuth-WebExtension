import { createRouter, createMemoryHistory } from 'vue-router'

const router = createRouter({
	history: createMemoryHistory(),
	routes: [
        { path: '/', name: 'landing', component: () => import('../views/Landing.vue'), meta: { middlewares: [] } },
        { path: '/setup', name: 'setup', component: () => import('../views/Setup.vue'), meta: { middlewares: [] } },
        { path: '/purpose', name: 'purpose', component: () => import('../views/Purpose.vue'), meta: { middlewares: [] } },

        { path: '/help', name: 'help', component: () => import('../views/Help.vue') },
        { path: '/error', name: 'genericError', component: () => import('../views/Error.vue'), meta: { middlewares: [], watchedByKicker: true } },
        { path: '/404', name: '404', component: () => import('../views/Error.vue'), meta: { watchedByKicker: true }, props: true },
        { path: '/:pathMatch(.*)*', name: 'notFound', component: () => import('../views/Error.vue'), meta: { watchedByKicker: true }, props: true },
	]
})

export default router
