<script setup>
    import { useAttrs, computed } from 'vue'
    import { useIdGenerator } from '@popup/composables/helpers'
    import { LucideChevronRight } from 'lucide-vue-next'

    defineOptions({
        inheritAttrs: false
    })

    const props = defineProps({
        modelValue: Boolean,
        fieldName: {
            type: String,
            default: '',
            required: true
        },
        label: {
            type: String,
            default: ''
        },
        labelClass: {
            type: String,
            default: ''
        },
        help: {
            type: String,
            default: ''
        },
        isIndented: Boolean,
        isDisabled: Boolean,
    })

    const emit = defineEmits(['update:modelValue'])
    const legendId = useIdGenerator('legend', props.fieldName).inputId
    const attrs = useAttrs()
    const model = computed({
        get() {
            return props.modelValue;
        },
        set(value) {
            emit("update:modelValue", value);
        },
    })

    function toggleModel() {
        if (attrs['disabled'] != true) {
            model.value = !model.value
        }
    }
</script>

<template>
    <div class="field is-flex">
        <div v-if="isIndented" class="pr-1" :style="{ 'opacity': isDisabled ? '0.5' : '1' }">
            <LucideChevronRight class="has-text-grey rotated-chevron" />
        </div>
        <div>
            <input :id="fieldName" type="checkbox" :name="fieldName" class="is-checkradio is-info" v-model="model" :disabled="isDisabled" :aria-describedby="help ? legendId : undefined" />
            <label tabindex="0" :for="fieldName" class="label" :class="labelClass" v-html="$t(label)" v-on:keypress.space.prevent="toggleModel" />
            <p :id="legendId" class="help" v-html="$t(help)" v-if="help" />
        </div>
    </div>
</template>