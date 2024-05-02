import { Knex } from 'knex'
import {
    createTestDatabase,
    destroyTestDatabase,
} from './testing'
import UserFactory, { TABLE_USERS } from 'factories/UserFactory'

const TOTAL_USERS = 2000

export const createBenchmarkDatabase = async (databaseName: string) => {
    const knex = await createTestDatabase(databaseName)
    if (knex) {
        const now = knex.fn.now()
        await knex.schema.createTable(TABLE_USERS, (table) => {
            table.increments().primary()
            table.datetime('createdAt').defaultTo(now)
            table.datetime('updatedAt').defaultTo(now)
            table.string('email').notNullable()
            table.string('firstName')
            table.string('lastName')
            table.unique(['email'])
        })
        await UserFactory.create(TOTAL_USERS)
    }
}

export const destroyBenchmarkDatabase = async (knex: Knex) => {
    await destroyTestDatabase(knex)
}
