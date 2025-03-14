<script setup>
    import { ref } from 'vue'
    import { useIdGenerator, useValidationErrorIdGenerator } from '@popup/composables/helpers'
    import { LucideChevronRight } from 'lucide-vue-next'

    const props = defineProps({
        modelValue: [String, Number, Boolean],
        label: {
            type: String,
            default: ''
        },
        fieldName: {
            type: String,
            default: '',
            required: true
        },
        fieldError: [String],
        options: {
            type: Array,
            required: true
        },
        help: {
            type: String,
            default: ''
        },
        isIndented: Boolean,
        isDisabled: Boolean,
        idSuffix: {
            type: String,
            default: ''
        },
    })

    const selected = ref(props.modelValue)
    const { inputId } = useIdGenerator('select', props.fieldName + props.idSuffix)
    const { valErrorId } = useValidationErrorIdGenerator(props.fieldName)
    const legendId = useIdGenerator('legend', props.fieldName + props.idSuffix).inputId
</script>

<template>
    <div class="field is-flex">
        <div v-if="isIndented" class="pr-1" :style="{ 'opacity': isDisabled ? '0.5' : '1' }">
            <LucideChevronRight class="has-text-grey rotated-chevron" />
        </div>
        <div>
            <label :for="inputId" class="label" v-html="$t(label)" :style="{ 'opacity': isDisabled ? '0.5' : '1' }"></label>
            <div class="control">
                <div class="select">
                    <select
                        :id="inputId"
                        v-model="selected"
                        v-on:change="$emit('update:modelValue', $event.target.value)"
                        :disabled="isDisabled"
                        :aria-describedby="help ? legendId : undefined"
                        :aria-invalid="fieldError != undefined"
                        :aria-errormessage="fieldError != undefined ? valErrorId : undefined" 
                    >
                        <option v-for="option in options" v-bind:key="option.value" :value="option.value">{{ $t(option.text) }}</option>
                    </select>
                </div>
            </div>
            <FieldError v-if="fieldError != undefined" :error="fieldError" :field="fieldName" />
            <p :id="legendId" class="help" v-html="$t(help)" v-if="help"></p>
        </div>
    </div>
</template>