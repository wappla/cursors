import { Knex } from 'knex'
import { firstBy } from 'thenby'
import {
    ASC, DESC, createCursor, cursorToSqlQuery
} from '../index'
import {
    createTestDatabase,
    destroyTestDatabase,
    getKnexConnection,
} from '../testing'
import UserFactory from '../factories/UserFactory'
import { TABLE_TASKS, TASK_STATUS_COMPLETED, TASK_STATUS_PENDING, tasks } from '../factories/TaskFactory'

const TABLE_USERS = 'users'
const TOTAL_USERS = 2
const TASKS_PER_USER = 2
const DATABASE_NAME = 'testing-postgres'

const users = () => {
    const knex = getKnexConnection(DATABASE_NAME)
    return knex(TABLE_USERS)
}

const createSchema = async (knex: Knex | null) => {
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
        table.unique(['email'])
    })
    await knex.schema.createTable(TABLE_TASKS, (table) => {
        table.increments().primary()
        table.datetime('createdAt').defaultTo(now)
        table.datetime('updatedAt').defaultTo(now)
        table.string('name').notNullable()
        table.enum('status', [TASK_STATUS_PENDING, TASK_STATUS_COMPLETED])
        table.integer('userId').unsigned().notNullable()
        table.foreign('userId').references(`${TABLE_USERS}.id`)
    })
}

let knex = null as Knex | null

beforeAll(async () => {
    knex = await createTestDatabase(DATABASE_NAME)
    await createSchema(knex)
    const users = await UserFactory.create(TOTAL_USERS)
    await Promise.all(users.map(async (user) => await user.createTasks(TASKS_PER_USER)))
})

afterAll(async () => {
    await destroyTestDatabase(knex)
})

test('if simple ascending order by finds the correct users.', async () => {
    const allUsers = await users().where({})
    const sortedUsers = allUsers.sort(firstBy('id', 'asc'))
    const orderBy = {
        id: ASC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, bindings, orderQuery] = cursorToSqlQuery(cursor, orderBy)
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
    const sortedUsers = allUsers.sort(firstBy('id', 'desc'))
    const orderBy = {
        id: DESC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, bindings, orderQuery] = cursorToSqlQuery(cursor, orderBy)
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
        firstBy('lastName', 'desc').thenBy('firstName', 'asc').thenBy('id', 'desc')
    )
    const orderBy = {
        lastName: DESC,
        firstName: ASC,
        id: DESC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, bindings, orderQuery] = cursorToSqlQuery(cursor, orderBy)
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

test('if no cursor sorts users correctly.', async () => {
    const allUsers = await users().where({})
    const sortedUsers = allUsers.sort(firstBy('id', 'desc'))
    const orderBy = {
        id: DESC,
    }
    let nextUser = sortedUsers[0]
    let cursor: string | null = null
    for (let i = 0; i <= TOTAL_USERS; i += 1) {
        const [query, bindings, orderQuery] = cursorToSqlQuery(cursor, orderBy)
        const knexQuery = query.replace(/\$\w+/g, '?')
        nextUser = await users()
            .whereRaw(knexQuery, bindings)
            .orderByRaw(orderQuery)
            .first()
        if (i < TOTAL_USERS) {
            expect(nextUser).toBeDefined()
            expect(nextUser.id).toEqual(sortedUsers[i].id)
            cursor = createCursor(nextUser, orderBy)
        }
    }
})

test('If joined table is sorted correctly', async () => {
    const allTasks = await tasks(DATABASE_NAME)
        .select(
            `${TABLE_TASKS}.id as taskId`,
            `${TABLE_TASKS}.createdAt`,
            `${TABLE_TASKS}.name`,
            `${TABLE_USERS}.id as userId`,
        )
        .leftJoin(TABLE_USERS, `${TABLE_TASKS}.userId`, `${TABLE_USERS}.id`)
    const sortedTasks = allTasks.sort(firstBy('createdAt', 'asc').thenBy('userId', 'asc'))
    
    const TOTAL_USER_TASKS = TOTAL_USERS * TASKS_PER_USER
    expect(sortedTasks.length).toEqual(TOTAL_USER_TASKS)

    const orderBy = {
        createdAt: {
            direction: ASC,
            column: `${TABLE_TASKS}"."createdAt`,
        },
        userId: {
            direction: ASC,
            column: `${TABLE_USERS}"."id`,
        },
    }

    let cursor: string | null = null
    let nextTask = sortedTasks[0]
    for (let i = 0; i <= TOTAL_USER_TASKS; i += 1) {
        const [whereQuery, whereValues, orderQuery] = cursorToSqlQuery(cursor, orderBy)
        const knexQuery = whereQuery.replace(/\$\w+/g, '?')
        nextTask = await tasks()
            .select(
                `${TABLE_TASKS}.id as taskId`,
                `${TABLE_TASKS}.createdAt`,
                `${TABLE_TASKS}.name`,
                `${TABLE_USERS}.id as userId`,
            )
            .leftJoin(TABLE_USERS, `${TABLE_TASKS}.userId`, `${TABLE_USERS}.id`)
            .whereRaw(knexQuery, whereValues)
            .orderByRaw(orderQuery)
            .first()
        if (i < TOTAL_USER_TASKS) {
            expect(nextTask).toBeDefined()
            expect(nextTask.name).toEqual(sortedTasks[i].name)
            expect(nextTask.taskId).toEqual(sortedTasks[i].taskId)
            expect(nextTask.createdAt).toEqual(sortedTasks[i].createdAt)
            cursor = createCursor(nextTask, orderBy)
        }
    }
})
