<script setup>
    import { computed } from 'vue';
    import { Sun, Moon, Grid3X3, List, MonitorCheck } from "lucide-vue-next";

    const icons = { Sun, Moon, Grid3X3, List, MonitorCheck }
    const props = defineProps({
        name: {
            type: String,
            required: true
        },
        size: Number,
        color: String,
        strokeWidth: Number,
        defaultClass: String
    })

    const icon = computed(() => icons[props.name]);
</script>

<template>
  <component
    :is="icon"
    :size="size"
    :color="color"
    :stroke-width="strokeWidth" :default-class="defaultClass"
  />
</template>