module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    globalSetup: './src/testingSetup.ts',
    transform: {
        '^.+\\.(t|j)sx?$': '@swc/jest',
    },
}
