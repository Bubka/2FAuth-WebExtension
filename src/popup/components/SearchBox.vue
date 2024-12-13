<script setup>
    const props = defineProps({
        keyword: String,
        hasNoBackground: {
            type: Boolean,
            default: false
        },
        placeholder: String,
    })
    const searchInput = ref(null)

    onMounted(() => {
        document.addEventListener('keydown', keyListener)
    })

    onUnmounted(() => {
        document.removeEventListener('keydown', keyListener)
    })

    /**
     * Attach an event listen for ctrl+F
     */
    function keyListener(e) {
        if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            searchInput.value?.focus()
        }
    }
</script>

<template>
    <div role="search" class="field">
        <div class="control has-icons-right">
            <input
                ref="searchInput"
                id="txtSearch"
                type="search"
                tabindex="1"
                :aria-label="$t('message.search')"
                :title="$t('message.search')"
                :placeholder="placeholder"
                class="input is-rounded is-search is-small"
                :class="{ 'has-no-background': hasNoBackground }"
                :value="keyword"
                v-on:keyup="$emit('update:keyword', $event.target.value)">
            <span class="icon is-small is-right">
                <button type="button" v-if="keyword != ''" id="btnClearSearch" tabindex="1" :title="$t('message.clear_search')" class="clear-selection delete" @click="$emit('update:keyword','')"></button>
                <FontAwesomeIcon v-else :icon="['fas', 'search']" />
            </span>
        </div>
    </div>
</template>