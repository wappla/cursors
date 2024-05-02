import { ClientConfig, Client as PostgresClient } from 'pg'
import createKnexConnection, { Knex } from 'knex'
import Factory from '@dashdot/factory'

export abstract class KnexFactory extends Factory {
    static async persist(records: any) {
        return this.table().insert(records).returning('*')
    }

    static get table(): () => Knex.QueryBuilder {
        throw new Error('Method not implemented.')
    }
}

export async function runRawQuery(query, useRoot = true) {
    const {
        POSTGRES_HOST,
        POSTGRES_PORT,
        POSTGRES_USERNAME,
        POSTGRES_PASSWORD,
        POSTGRES_DATABASE,
    } = process.env
    const config = {
        host: POSTGRES_HOST,
        port: POSTGRES_PORT,
        user: POSTGRES_USERNAME,
        password: POSTGRES_PASSWORD,
        database: 'postgres',
        ssl: false
    } as ClientConfig
    if (!useRoot) {
        config.database = POSTGRES_DATABASE
    }
    const client = new PostgresClient(config)
    await client.connect()
    const result = await client.query(query)
    await client.end()
    return result
}

export function createKnexConfig(databaseName?: string): Knex.Config {
    const {
        POSTGRES_HOST,
        POSTGRES_PORT,
        POSTGRES_USERNAME,
        POSTGRES_PASSWORD,
        POSTGRES_DATABASE,
    } = process.env
    const port = POSTGRES_PORT as string
    return {
        client: 'postgres',
        connection: {
            timezone: 'UTC',
            host: POSTGRES_HOST,
            port: parseInt(port),
            database: databaseName || POSTGRES_DATABASE,
            user: POSTGRES_USERNAME,
            password: POSTGRES_PASSWORD,
            dateStrings: true,
            ssl: false
        },
        pool: {
            min: 0,
            max: 10
        },
        useNullAsDefault: true,
    }
}

let cache = null as Knex | null
export function getKnexConnection(databaseName?: string) {
    if (cache === null) {
        const config = createKnexConfig(databaseName)
        cache = createKnexConnection(config)
    }
    return cache
}

export async function createTestDatabase(name: string) {
    try {
        await runRawQuery(`DROP DATABASE IF EXISTS "${name}";`)
        await runRawQuery(`CREATE DATABASE "${name}";`)
        return getKnexConnection(name)
    } catch (error) {
        console.error(error)
        return null
    }
}

export async function destroyTestDatabase(knex: Knex | null = null) {
    if (knex === null) {
        return
    }
    try {
        const databaseName = knex.client.config.connection.database
        await knex.destroy()
        const destroyDatabaseQuery = `DROP DATABASE IF EXISTS "${databaseName}";`
        await runRawQuery(destroyDatabaseQuery)
    } catch (error) {
        console.error(error)
    }
}
