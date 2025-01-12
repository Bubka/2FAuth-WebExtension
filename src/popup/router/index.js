import { createRouter, createMemoryHistory } from 'vue-router'
import middlewarePipeline  from '@popup/router/middlewarePipeline'
import { useSettingStore } from '@/stores/settingStore'
import mustBeConfigured    from './middlewares/mustBeConfigured'

const router = createRouter({
	history: createMemoryHistory('/'),
	routes: [
        { path: '/landing', name: 'landing', component: () => import('../views/Landing.vue'), meta: {  } },
        { path: '/setup', name: 'setup', component: () => import('../views/Setup.vue'), meta: {  } },
        { path: '/purpose', name: 'purpose', component: () => import('../views/Purpose.vue'), meta: { } },

        { path: '/unlock', name: 'unlock', component: () => import('../views/Unlock.vue'), meta: { middlewares: [mustBeConfigured] } },
        { path: '/accounts', name: 'accounts', component: () => import('../views/Accounts.vue'), meta: { middlewares: [mustBeConfigured] }, alias: '/' },
        { path: '/settings/options', name: 'settings.options', component: () => import('../views/settings/Options.vue'), meta: { middlewares: [mustBeConfigured], watchedByKicker: true } },
        { path: '/settings/extension', name: 'settings.extension', component: () => import('../views/settings/Extension.vue'), meta: { middlewares: [mustBeConfigured], watchedByKicker: true } },
        
        { path: '/about', name: 'about', component: () => import('../views/About.vue') },
        
        { path: '/error', name: 'genericError', component: () => import('../views/Error.vue'), meta: { watchedByKicker: true } },
        { path: '/404', name: '404', component: () => import('../views/Error.vue'), meta: { watchedByKicker: true }, props: true },
        { path: '/:pathMatch(.*)*', name: 'notFound', component: () => import('../views/Error.vue'), meta: { watchedByKicker: true }, props: true },
	]
})

router.beforeEach((to, from, next) => {
    const middlewares = to.meta.middlewares
    const settingStore = useSettingStore()

    const stores = { settingStore: settingStore }
    const nextMiddleware = {}
    const context = { to, from, next, nextMiddleware, stores }

    if (!middlewares) {
        return next();
    }

    middlewares[0]({
        ...context,
        nextMiddleware: middlewarePipeline(context, middlewares, 1),
    });
})

export default router
