<script setup lang="ts">
import { use_database } from '../stores/database_store'
import { use_notification } from '../stores/notification_store'
import type { Request } from '../models/request'
import { onMounted, ref } from 'vue'
import { Employee } from '../models/employee'
import * as bulmaCalendar from 'bulma-calendar'
import { Equipment } from '../models/equipment'
import { overlaps } from '../utils'

type State = 'button' | 'editing'
type Event = 'add' | 'save' | 'cancel'

const db = use_database()
const { show } = use_notification()

const props = defineProps({
    employee: { type: Employee, required: true }
})

const emit = defineEmits<{ (e: 'saved', value: Request): void, (e: 'invalid'): void }>()
const state = ref<State>('button')
const equipment = ref<Equipment[]>([])
const requests = ref([])
const object = ref(default_object())

onMounted(() => {
    db.get_equipment().then(f => equipment.value = f)
    db.get_all_requests().then(r => requests.value = r)

    const calendar = bulmaCalendar.attach('input[type = date]', {
        lang: 'ru',
        dateFormat: 'dd.MM.yyyy',
        isRange: true,
        startDate: object.value.start_booking,
        endDate: object.value.end_booking
    })[0]
    calendar.on('select', args => {
        object.value.start_booking = args.data.startDate
        object.value.end_booking = args.data.endDate
    })
})

function validate(): [false, string] | true {
    if (object.value.end_booking === undefined || object.value.start_booking === undefined)
        return [false, 'Не выбраны даты назначения']
    if (object.value.end_booking <= object.value.start_booking)
        return [false, 'Конец бронирования оборудования не должен быть раньше начала']
    if (object.value.equipment.id === undefined)
        return [false, 'Выберите оборудование']
    // if (object.value.equipment.amount === 0)
    //     return [false, 'Оборудования не осталось']
    for (let request of requests.value) {
        console.log(request)
        if (overlaps(
            { from: request.start_booking, to: request.end_booking },
            { from: object.value.start_booking, to: object.value.end_booking }))
            return [false, 'Назначения пересекаются по дате']
    }
    return true
}

function default_object(): Omit<Request, 'id'> {
    return {
        equipment: {
            id: undefined,
            name: undefined,
            amount: undefined
        },
        end_booking: undefined,
        start_booking: undefined
    }
}

function send(event: Event) {
    switch (event) {
        case 'add':
            state.value = 'editing'
            break
        case 'save':
            (async () => {
                const validated = validate()
                if (validated !== true) {
                    emit('invalid')
                    show(validated[1], true)
                } else {
                    const request = await db.add_request(props.employee.id, object.value.equipment, object.value.start_booking, object.value.end_booking)
                    emit('saved', request)
                    state.value = 'button'
                    object.value = default_object()
                    equipment.value = await db.get_equipment()
                }
            })()
            break
        case 'cancel':
            object.value = default_object()
            state.value = 'button'
            break
    }
}
</script>

<template>
    <div class="card">
        <div class="card-header has-background-light">
            <div class="card-header-title has-text-dark">Добавление назначения</div>
            <img class="card-header-icon"
                 src="../assets/icons/icons8-plus-24-dark.png"
                 alt="plus"
                 v-show="state === 'button' && props.employee.requests.length <= 4"
                 @click="send('add')"
            >
        </div>
        <div class="card-content" v-show="state === 'editing'">
            <div class="columns is-mobile is-align-items-center">
                <div class="column is-4">
                    <p>Оборудование:</p>
                </div>
                <div class="column">
                    <div class="is-flex is-align-items-center">
                        <div class="select">
                            <select v-model="object.equipment">
                                <option disabled :value="default_object().equipment">Выбрать</option>
                                <option v-for="equipment in equipment" :key="equipment.id" :value="equipment">
                                    {{ equipment.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="columns is-mobile">
                <div class="column is-4">
                    <p>Сроки назначения:</p>
                </div>
                <div class="column">
                    <input type="date">
                </div>
            </div>
        </div>
        <div class="card-footer" v-show="state === 'editing'">
            <a @click="send('cancel')" class="card-footer-item has-text-danger">Отменить</a>
            <a @click="send('save')" class="card-footer-item has-text-success">Сохранить</a>
        </div>
    </div>
</template>
