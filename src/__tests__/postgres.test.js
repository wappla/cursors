/* eslint-disable no-await-in-loop */
import by from 'thenby'
import faker from '@faker-js/faker'
import {
    ASC,
    DESC,
    createCursor,
    cursorToSqlQuery,
} from '../index'
import {
    createTestDatabase,
    destroyTestDatabase,
    KnexFactory,
    getKnexConnection
} from '../testing'

const TABLE_USERS = 'users'
const TOTAL_USERS = 10
const DATABASE_NAME = 'testing-postgres'

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

const createSchema = async (knex) => {
    if (knex == null) {
        return
    }
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
}

let knex = null

beforeAll(async () => {
    knex = await createTestDatabase(DATABASE_NAME)
    await createSchema(knex)
    await UserFactory.create(TOTAL_USERS)
})

afterAll(async () => {
    await destroyTestDatabase(knex)
})

test('if simple ascending order by finds the correct users.', async () => {
    const allUsers = await users().where({})
    const sortedUsers = allUsers.sort(by('id', 'asc'))
    const orderBy = {
        id: ASC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, bindings, orderQuery] = cursorToSqlQuery(cursor)
        const knexQuery = query.replace(/\$\w+/g, '?')
        nextUser = await users()
            .whereRaw(knexQuery, bindings)
            .orderByRaw(orderQuery)
            .first()
        if (i < TOTAL_USERS) {
            expect(nextUser).toBeDefined()
            expect(nextUser.id).toEqual(sortedUsers[i].id)
        }
    }
})

test('if simple descending order by finds the correct users.', async () => {
    const allUsers = await users().where({})
    const sortedUsers = allUsers.sort(by('id', 'desc'))
    const orderBy = {
        id: DESC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, bindings, orderQuery] = cursorToSqlQuery(cursor)
        const knexQuery = query.replace(/\$\w+/g, '?')
        nextUser = await users()
            .whereRaw(knexQuery, bindings)
            .orderByRaw(orderQuery)
            .first()
        if (i < TOTAL_USERS) {
            expect(nextUser).toBeDefined()
            expect(nextUser.id).toEqual(sortedUsers[i].id)
        }
    }
})

test('if advanced order by finds the correct users.', async () => {
    const allUsers = await users().where({})
    const sortedUsers = allUsers.sort(
        by('lastName', 'desc')
            .thenBy('firstName', 'asc')
            .thenBy('id', 'desc')
    )
    const orderBy = {
        lastName: DESC,
        firstName: ASC,
        id: DESC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, bindings, orderQuery] = cursorToSqlQuery(cursor)
        const knexQuery = query.replace(/\$\w+/g, '?')
        nextUser = await users()
            .whereRaw(knexQuery, bindings)
            .orderByRaw(orderQuery)
            .first()
        if (i < TOTAL_USERS) {
            expect(nextUser).toBeDefined()
            expect(nextUser.id).toEqual(sortedUsers[i].id)
        }
    }
})
