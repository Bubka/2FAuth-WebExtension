<script setup>
    import { useIdGenerator, useValidationErrorIdGenerator } from '@popup/composables/helpers'
    import { LucideChevronRight, LucideLock } from 'lucide-vue-next'

    defineOptions({
        inheritAttrs: false
    })

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
        placeholder: {
            type: String,
            default: ''
        },
        help: {
            type: String,
            default: ''
        },
        size: {
            type: String,
            default: ''
        },
        hasOffset: {
            type: Boolean,
            default: false
        },
        isDisabled: {
            type: Boolean,
            default: false
        },
        maxLength: {
            type: Number,
            default: null
        },
        isIndented: Boolean,
        isLocked: Boolean,
        leftIcon: '',
        rightIcon: '',
        idSuffix: {
            type: String,
            default: ''
        }
    })

    const { inputId } = useIdGenerator(props.inputType, props.fieldName + props.idSuffix)
    const { valErrorId } = useValidationErrorIdGenerator(props.fieldName)
    const legendId = useIdGenerator('legend', props.fieldName).inputId
</script>

<template>
    <div class="mb-3" :class="{ 'pt-3' : hasOffset, 'is-flex' : isIndented }">
        <div v-if="isIndented" class="mx-2 pr-1" :class="{ 'is-opacity-5' : isDisabled || isLocked }">
            <LucideChevronRight class="has-text-grey rotated-chevron" />
        </div>
        <div class="field" :class="{ 'is-flex-grow-5' : isIndented }">
            <label v-if="label" :for="inputId" class="label">
                {{ $t(label) }}<LucideLock v-if="isLocked" class="ml-2 icon-size-1" />
            </label>
            <div class="control" :class="{ 'has-icons-left' : leftIcon, 'has-icons-right': rightIcon }">
                <textarea 
                    :disabled="isDisabled || isLocked" 
                    :id="inputId"
                    class="textarea has-fixed-size" 
                    :class="size"
                    :value="modelValue" 
                    :placeholder="placeholder" 
                    v-bind="$attrs"
                    v-on:input="$emit('update:modelValue', $event.target.value)"
                    v-on:change="$emit('change:modelValue', $event.target.value)"
                    :maxlength="maxLength"
                    :aria-describedby="help ? legendId : undefined"
                    :aria-invalid="fieldError != undefined"
                    :aria-errormessage="fieldError != undefined ? valErrorId : undefined" 
                />
            </div>
            <FieldError v-if="fieldError != undefined" :error="fieldError" :field="fieldName" />
            <p :id="legendId" class="help" v-html="$t(help)" v-if="help"></p>
        </div>
    </div> 
</template>
