<script setup>
    const tabs = ref([
        {
            'name' : 'message.options',
            'view' : 'settings.options',
            'id'   : 'lnkTabOptions'
        },
        {
            'name' : 'message.extension',
            'view' : 'settings.extension',
            'id'   : 'lnkTabExtSetup'
        },
        {
            'name' : 'message.about',
            'view' : 'settings.about',
            'id'   : 'lnkTabAbout'
        },
    ])

    const props = defineProps({
        activeTab: {
            type: String,
            default: ''
        },
    })
</script>

<template>
    <div class="options-header">
        <!-- <ResponsiveWidthWrapper> -->
            <div class="tabs is-centered is-fullwidth">
                <ul>
                    <li v-for="tab in tabs" :key="tab.view" :class="{ 'is-active': tab.view === props.activeTab }">
                        <RouterLink :id="tab.id" :to="{ name: tab.view }">{{ $t(tab.name) }}</RouterLink>
                    </li>
                </ul>
            </div>
        <!-- </ResponsiveWidthWrapper> -->
    </div>
</template>