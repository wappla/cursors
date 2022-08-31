/* eslint-disable no-console */
import dotEnv from 'dotenv'
import { createBenchmarkDatabase, destroyBenchmarkDatabase } from './src/benchmarking'

async function start() {
    dotEnv.config()
    console.info('Creating benchmark database...')
    const knex = await createBenchmarkDatabase('test')
    console.info('Benchmark database created.')
    console.info('Destroying benchmark database...')
    await destroyBenchmarkDatabase(knex)
    console.info('Benchmark database destroyed.')
}

start()
