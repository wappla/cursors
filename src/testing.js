/* eslint-disable no-await-in-loop */
/* eslint-disable import/prefer-default-export */
import { Client as PostgresClient } from 'pg'
import createKnexConnection from 'knex'
import Factory from '@dashdot/factory'

export class KnexFactory extends Factory {
    static async persist(records) {
        const results = []
        const batchSize = 1000
        let indexed = 0
        while (indexed < records.length) {
            const batch = records.slice(indexed, indexed + batchSize)
            if (batch.length > 0) {
                // eslint-disable-next-line no-await-in-loop
                const batchResult = await this.table().insert(batch).returning('*')
                results.push(batchResult)
            }
            indexed += batchSize
        }
        return results
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
    }
    if (!useRoot) {
        config.database = POSTGRES_DATABASE
    }
    const client = new PostgresClient(config)
    await client.connect()
    const result = await client.query(query)
    await client.end()
    return result
}

export function createKnexConfig(database) {
    const {
        POSTGRES_HOST,
        POSTGRES_PORT,
        POSTGRES_USERNAME,
        POSTGRES_PASSWORD,
        POSTGRES_DATABASE,
    } = process.env
    return {
        client: 'postgres',
        connection: {
            timezone: 'UTC',
            host: POSTGRES_HOST,
            port: POSTGRES_PORT,
            database: database || POSTGRES_DATABASE,
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

let cache = null
export function getKnexConnection(databaseName) {
    if (cache === null) {
        const config = createKnexConfig(databaseName)
        cache = createKnexConnection(config)
    }
    return cache
}

export async function createTestDatabase(name) {
    try {
        await runRawQuery(`DROP DATABASE IF EXISTS "${name}";`)
        await runRawQuery(`CREATE DATABASE "${name}";`)
        const knex = getKnexConnection(name)
        knex.DB_NAME = name
        return knex
    } catch (error) {
        console.error(error)
        return null
    }
}

export async function destroyTestDatabase(knex = null) {
    if (knex === null) {
        return
    }
    try {
        await knex.destroy()
        const destroyDatabaseQuery = `DROP DATABASE IF EXISTS "${knex.DB_NAME}";`
        await runRawQuery(destroyDatabaseQuery)
    } catch (error) {
        console.error(error)
    }
}
