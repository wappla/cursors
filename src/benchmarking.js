/* eslint-disable import/prefer-default-export */
/* eslint-disable no-await-in-loop */
import faker from '@faker-js/faker'
import {
    createTestDatabase,
    destroyTestDatabase,
    KnexFactory,
    getKnexConnection
} from './testing'

const TABLE_USERS = 'users'
const TOTAL_USERS = 2000

const users = () => {
    const knex = getKnexConnection()
    return knex(TABLE_USERS)
}

class UserFactory extends KnexFactory {
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
}

export const createBenchmarkDatabase = async (databaseName) => {
    const knex = await createTestDatabase(databaseName)
    const now = knex.fn.now()
    await knex.schema.createTable(TABLE_USERS, (table) => {
        table.increments().primary()
        table.datetime('createdAt').defaultTo(now)
        table.datetime('updatedAt').defaultTo(now)
        table.string('email').notNullable()
        table.string('firstName')
        table.string('lastName')
        table.unique('email')
    })
    await UserFactory.create(TOTAL_USERS)
}

export const destroyBenchmarkDatabase = async (knex) => {
    await destroyTestDatabase(knex)
}
