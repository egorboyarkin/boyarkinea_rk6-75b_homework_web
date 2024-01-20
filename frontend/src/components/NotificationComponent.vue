<script lang="ts">
import { defineComponent } from 'vue'
import { use_notification } from '@/stores/notification_store'

const { state } = use_notification()

export default defineComponent({
    data() {
        return {
            state
        }
    }
})
</script>

<template>
    <Transition>
        <div class="notification notification-flash is-danger" v-show="state.shown">
            <button @click="state.shown = false" class="delete"></button>
            <slot>{{ state.text }}</slot>
        </div>
    </Transition>
</template>

<style scoped>
.notification-flash {
    position: fixed;
    bottom: 0;
    right: 0;
    margin: 2%;
    z-index: 100;
}

</style>