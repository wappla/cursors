/* eslint-disable no-await-in-loop */
import by from 'thenby'
import faker from '@faker-js/faker'
import { Schema, model } from 'mongoose'
import {
    ASC,
    DESC,
    createCursor,
    cursorToMongoQuery,
} from '../index'
import {
    createTestDatabase,
    destroyTestDatabase,
    MongoFactory
} from '../testingMongo'

const COLLECTION = 'users'
const TOTAL_USERS = 10
const DATABASE_NAME = 'testing-mongo'

const UserSchema = new Schema({
    firstName: {
        type: String,
        default: null,
    },
    lastName: {
        type: String,
        default: null,
    },
    email: {
        type: String,
        unique: true,
        trim: true,
        lowercase: true,
        required: true,
    },
}, {
    timestamps: true
})

const UserCollection = model(COLLECTION, UserSchema)

class UserFactory extends MongoFactory {
    static get Model() {
        return model(COLLECTION, UserSchema)
    }

    static async make() {
        return {
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            email: faker.unique(faker.internet.email),
        }
    }
}

beforeAll(async () => {
    await createTestDatabase(DATABASE_NAME)
    await UserFactory.create(100)
})

afterAll(async () => {
    await destroyTestDatabase(DATABASE_NAME)
})

test('if simple ascending order by finds the correct users.', async () => {
    const allUsers = await UserCollection.find({}).lean()
    const sortedUsers = allUsers
        .sort(by('_id', 'asc'))
    const orderBy = {
        _id: ASC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, orderQuery] = cursorToMongoQuery(cursor, orderBy)
        nextUser = await UserCollection
            .findOne(query)
            .sort(orderQuery)
            .lean()
        if (i < TOTAL_USERS) {
            expect(nextUser).not.toBeNull()
            expect(nextUser._id.toString()).toEqual(sortedUsers[i]._id.toString())
        }
    }
})

test('if simple descending order by finds the correct users.', async () => {
    const allUsers = await UserCollection.find({}).lean()
    const sortedUsers = allUsers.sort(by('_id', 'desc'))
    const orderBy = {
        _id: DESC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, orderQuery] = cursorToMongoQuery(cursor, orderBy)
        nextUser = await UserCollection
            .findOne(query)
            .sort(orderQuery)
            .lean()
        if (i < TOTAL_USERS) {
            expect(nextUser).toBeDefined()
            expect(nextUser._id.toString()).toEqual(sortedUsers[i]._id.toString())
        }
    }
})

test('if advanced order by finds the correct users.', async () => {
    const allUsers = await UserCollection.find({}).lean()
    const sortedUsers = allUsers.sort(
        by('lastName', 'desc')
            .thenBy('firstName', 'asc')
            .thenBy('_id', 'desc')
    )
    const orderBy = {
        lastName: DESC,
        firstName: ASC,
        _id: DESC,
    }
    let nextUser = sortedUsers[0]
    for (let i = 1; i <= TOTAL_USERS; i += 1) {
        const cursor = createCursor(nextUser, orderBy)
        const [query, orderQuery] = cursorToMongoQuery(cursor, orderBy)
        nextUser = await UserCollection
            .findOne(query)
            .sort(orderQuery)
            .lean()
        if (i < TOTAL_USERS) {
            expect(nextUser).toBeDefined()
            expect(nextUser._id.toString()).toEqual(sortedUsers[i]._id.toString())
        }
    }
})

test('if no cursor sorts users correctly.', async () => {
    const allUsers = await UserCollection.find({}).lean()
    const sortedUsers = allUsers.sort(by('_id', 'desc'))
    const orderBy = {
        _id: DESC,
    }
    let nextUser = sortedUsers[0]
    let cursor = null
    for (let i = 0; i <= TOTAL_USERS; i += 1) {
        const [query, orderQuery] = cursorToMongoQuery(cursor, orderBy)
        nextUser = await UserCollection
            .findOne(query)
            .sort(orderQuery)
            .lean()
        if (i < TOTAL_USERS) {
            expect(nextUser).toBeDefined()
            expect(nextUser._id.toString()).toEqual(sortedUsers[i]._id.toString())
            cursor = createCursor(nextUser, orderBy)
        }
    }
})
