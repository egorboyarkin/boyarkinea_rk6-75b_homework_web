import { type Ref, ref } from 'vue'
import { Employee } from '../models/employee'
import { use_notification } from './notification_store'
import { Request } from '../models/request'
import { create, delete_, read, update } from '../utils'
import { Equipment } from '../models/equipment'

const employees_db: Ref<Set<number>> = ref(new Set())

const { show } = use_notification()

async function reload_store() {
    employees_db.value.clear()
    await read<number[]>('/api/employee/')
        .then(it => employees_db.value = new Set(it))
        .catch(e => show(`Невозможно подключиться к серверу: ${e}`, true))
}

reload_store().then()

export function use_database() {
    return {
        employees: employees_db,

        async add_employee(fullname: string) {
            const { id } = await create('/api/employee/', { fullname })
            employees_db.value.add(id)
            return new Employee(fullname, [], id)
        },
        async get_employee_by_id(id: number) {
            return await read<Employee>(`/api/employee/${id}`)
        },
        async remove_employee_by_id(id: number) {
            employees_db.value.delete(id)
            await delete_(`/api/employee/${id}`)
        },
        async update_employee({ fullname, id }: Employee) {
            await update(`/api/employee/${id}`, { fullname })
        },
        async add_request(mentor_id: number, equipment: Equipment, start_booking: Date, end_booking: Date) {
            const { id } = await create(`/api/employee/${mentor_id}/request`, {
                start_booking,
                end_booking,
                EquipmentId: equipment.id
            })
            return new Request(id, equipment, start_booking, end_booking)
        },
        async remove_request_by_id(mentor_id: number, team_id: number) {
            await delete_(`/api/employee/${mentor_id}/request/${team_id}`)
        },
        async update_request(mentor_id: number, { id, equipment, start_booking, end_booking }: Request) {
            await update(`/api/employee/${mentor_id}/request/${id}`, {
                start_booking,
                end_booking,
                EquipmentId: equipment.id
            })
        },
        async get_request_by_id(mentor_id: number, team_id: number) {
            const request = await read<any>(`/api/employee/${mentor_id}/request/${team_id}`)
            return new Request(request.id, request.EquipmentId, request.start_booking, request.end_booking)
        },
        async get_equipment() {
            return await read<Equipment[]>('/api/equipment')
        },
        async get_all_requests() {
            const requests = await read<{
                id: number,
                start_booking: string,
                end_booking: string
            }[]>(`/api/request`)
            return requests.map(r => {
                return { id: r.id, start_booking: new Date(r.start_booking), end_booking: new Date(r.end_booking) }
            })
        },
        reload_store
    }
}