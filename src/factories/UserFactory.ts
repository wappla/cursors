import faker from '@faker-js/faker'
import { KnexFactory, getKnexConnection } from '../testing'
import TaskFactory from './TaskFactory'

export const TABLE_USERS = 'users'

export type User = {
    id: string
    firstName: string
    lastName: string
    email: string
}

export const users = (databaseName?: string) => {
    const knex = getKnexConnection(databaseName)
    return knex(TABLE_USERS)
}

export default class UserFactory extends KnexFactory implements User {
    id: string
    firstName: string
    lastName: string
    email: string

    static get table() {
        return users
    }

    static async make() {
        return {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.unique(faker.internet.email),
        }
    }

    createTasks(records, states = [], data = {}) {
        return TaskFactory.create(records, states, {
            ...data,
            userId: this.id,
        })
    }
}
