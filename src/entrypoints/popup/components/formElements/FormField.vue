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
        inputType: {
            type: String,
            default: 'text'
        },
        placeholder: {
            type: String,
            default: ''
        },
        help: {
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
        },
    })

    const { inputId } = useIdGenerator(props.inputType, props.fieldName + props.idSuffix)
    const { valErrorId } = useValidationErrorIdGenerator(props.fieldName)
    const legendId = useIdGenerator('legend', props.fieldName).inputId
</script>

<template>
    <div class="mb-3" :class="{ 'pt-3' : hasOffset, 'is-flex' : isIndented }">
        <div v-if="isIndented" class="pr-1" :class="{ 'is-opacity-5' : isDisabled || isLocked }">
            <LucideChevronRight class="has-text-grey rotated-chevron" />
        </div>
        <div class="field">
            <label :for="inputId" class="label" :class="{ 'is-opacity-5' : isDisabled || isLocked }">
                {{ $t(label) }}<LucideLock v-if="isLocked" class="ml-2 icon-size-1" />
            </label>
            <div class="control" :class="{ 'has-icons-left' : leftIcon, 'has-icons-right': rightIcon }">
                <input 
                    :disabled="isDisabled || isLocked" 
                    :id="inputId" 
                    :type="inputType" 
                    class="input" 
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
                <span v-if="leftIcon" class="icon is-small is-left">
                    <!-- TODO: Add Lucide generic icon -->
                </span>
                <span v-if="rightIcon" class="icon is-small is-right">
                    <!-- TODO: Add Lucide generic icon -->
                </span>
            </div>
            <FieldError v-if="fieldError != undefined" :error="fieldError" :field="fieldName" />
            <p :id="legendId" class="help" v-html="$t(help)" v-if="help"></p>
        </div>
    </div> 
</template>
