import mongoose from 'mongoose'
import Factory from '@dashdot/factory'

const createMongooseUri = (database = process.env.MONGO_DATABASE) => {
    const {
        NODE_ENV,
        MONGO_HOST,
        MONGO_PORT,
        MONGO_USERNAME,
        MONGO_PASSWORD,
    } = process.env
    let srv = ''
    let authSource = ''
    if (NODE_ENV === 'local' || NODE_ENV === 'test') {
        authSource = '?authSource=admin'
    } else {
        srv = '+srv'
    }
    return `mongodb${srv}://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${database}${authSource}`
}

export async function disconnectMongoDatabase() {
    await mongoose.disconnect()
}

export async function dropMongoDatabase() {
    await mongoose.connection.db.dropDatabase()
}

export async function connectMongoDatabase(databaseName) {
    const uri = createMongooseUri(databaseName)
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
}

export class MongoFactory extends Factory {
    static async persist(records) {
        const docs = await this.Model.insertMany(records)
        return docs.map((doc) => doc.toObject({
            virtuals: true,
            getters: true
        }))
    }
}

export async function createTestDatabase(name) {
    try {
        await connectMongoDatabase(name)
        await dropMongoDatabase()
    } catch (e) {
        console.error(e)
    }
}

export async function destroyTestDatabase() {
    try {
        await dropMongoDatabase()
        await disconnectMongoDatabase()
    } catch (e) {
        console.error(e)
    }
}
