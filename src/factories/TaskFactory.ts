import faker from '@faker-js/faker'
import { KnexFactory, getKnexConnection } from '../testing'

export const TABLE_TASKS = 'tasks'

export const TASK_STATUS_PENDING = 'pending'
export const TASK_STATUS_COMPLETED = 'completed'

export const tasks = (databaseName?: string) => {
    const knex = getKnexConnection(databaseName)
    return knex(TABLE_TASKS)
}

export default class TaskFactory extends KnexFactory {
    static get table() {
        return tasks
    }

    static async make() {
        return {
            name: faker.unique(faker.name.jobTitle),
            status: faker.helpers.arrayElement([TASK_STATUS_PENDING, TASK_STATUS_COMPLETED]),
            createdAt: faker.date.past(),
        }
    }
}
