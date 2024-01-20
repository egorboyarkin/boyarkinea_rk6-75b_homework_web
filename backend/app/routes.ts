import { Express } from 'express'
import { Employee, Equipment, Request } from './database'

const not_found_msg = {
    message: 'Not Found'
}

const ok_msg = {
    message: 'Ok'
}

const created = (id: number) => {
    return { message: 'Ok', id }
}

export default function routes(app: Express) {
    app.get('/api/employee', async (_, res) => {
        const employees = await Employee.findAll({
            attributes: { include: ['id'] }
        })
        res.json(employees.map(it => it.id))
    })

    app.get('/api/employee/:id', async (req, res) => {
        const employee = await Employee.findByPk(req.params.id, {
            include: [Request]
            // order: [['Request.start_booking', 'DESC']]
        })
        if (employee === null)
            return res.status(404).json(not_found_msg)

        res.json(employee)
    })

    app.get('/api/employee/:id/request', async (req, res) => {
        const requests = await Request.findAll({
            where: { EmployeeId: req.params.id }
        })
        return res.json(requests)
    })

    app.get('/api/employee/:id/request/:req_id', async (req, res) => {
        const request = await Request.findByPk(req.params.req_id)
        if (request === null)
            return res.status(404).json(not_found_msg)

        const equipment = await Equipment.findByPk(request.EquipmentId)
        return res.json({
            ...request.dataValues,
            EquipmentId: equipment
        })
    })

    app.delete('/api/employee/:id', async (req, res) => {
        await Employee.destroy({ where: { id: req.params.id } })
        res.json(ok_msg)
    })

    app.delete('/api/employee/:id/request/:req_id', async (req, res) => {
        const request = await Request.findByPk(req.params.req_id)
        if (request !== null) {
            const equipment = await Equipment.findByPk(request.EquipmentId)
            equipment!.amount += 1
            await equipment!.save()
            await request.destroy()
        }
        res.json(ok_msg)
    })

    app.post('/api/employee', async (req, res) => {
        try {
            const mentor = await Employee.create(req.body)
            return res.json(created(mentor.id))
        } catch (ex) {
            return res.status(400).json({ message: ex })
        }
    })

    app.patch('/api/employee/:id', async (req, res) => {
        try {
            const mentor = await Employee.findByPk(req.params.id)
            await mentor?.update(req.body)
            await mentor?.save()
            res.json(ok_msg)
        } catch (ex) {
            res.status(400).json({ message: ex })
        }
    })

    app.post('/api/employee/:id/request', async (req, res) => {
        try {
            const { EquipmentId, ...data } = req.body
            const request = await Request.create({ EmployeeId: req.params.id, EquipmentId, ...data })
            const equipment = await Equipment.findByPk(EquipmentId)
            if (equipment !== null) {
                equipment.amount -= 1
                await equipment.save()
            }
            return res.json(created(request.id))
        } catch (ex) {
            return res.status(400).json({ message: ex })
        }
    })

    app.delete('/api/employee/:id/request/:req_id', async (req, res) => {
        await Request.destroy({ where: { id: req.params.id } })
        return res.json(ok_msg)
    })

    app.patch('/api/employee/:id/request/:req_id', async (req, res) => {
        try {
            const request = await Request.findByPk(req.params.req_id)
            await request?.update(req.body)
            await request?.save()
            res.json(ok_msg)
        } catch (ex) {
            res.status(400).json({ message: ex })
        }
    })

    app.get('/api/equipment', async (req, res) => {
        res.json(await Equipment.findAll())
    })

    app.get('/api/request', async (req, res) => {
        return res.json(await Request.findAll())
    })
}
