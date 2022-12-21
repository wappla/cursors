import {
    ASC,
    DESC,
    createCursor,
    cursorToMongoQuery,
} from '../index'

test('if \'cursorToMongoQuery\' return correct values.', async () => {
    const _id = 1
    const firstName = 'dries'
    const lastName = 'vdm'
    const user = {
        _id,
        firstName,
        lastName,
    }
    const orderBy = {
        _id: DESC,
    }
    const cursor = createCursor(user, orderBy)
    const query = cursorToMongoQuery(cursor, orderBy)
    const expectedResult = {
        _id: { $lt: _id }
    }
    expect(query[0]).toEqual(expectedResult)
})

test('if \'cursorToMongoQuery\' return correct values.', async () => {
    const _id = 1
    const firstName = 'dries'
    const lastName = 'vdm'
    const user = {
        _id,
        firstName,
        lastName,
    }
    const orderBy = {
        firstName: ASC,
        lastName: DESC,
        _id: DESC,
    }
    const cursor = createCursor(user, orderBy)
    const query = cursorToMongoQuery(cursor, orderBy)
    const expectedResult = {
        $and: [
            { firstName: { $gte: firstName } },
            {
                $or: [
                    { firstName: { $gt: firstName } },
                    {
                        $and: [
                            {
                                lastName: { $lte: lastName }
                            },
                            {
                                $or: [
                                    { lastName: { $lt: lastName } },
                                    { _id: { $lt: _id } }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
    expect(query[0]).toEqual(expectedResult)
})

test('if \'cursorToMongoQuery\' return correct values.', async () => {
    const _id = 1
    const firstName = 'dries'
    const lastName = 'vdm'
    const email = 'dries@vdm.be'
    const user = {
        _id,
        firstName,
        lastName,
        email,
    }
    const orderBy = {
        email: ASC,
        firstName: ASC,
        lastName: ASC,
        _id: DESC,
    }
    const cursor = createCursor(user, orderBy)
    const query = cursorToMongoQuery(cursor, orderBy)
    const expectedResult = {
        $and: [
            { email: { $gte: email } },
            {
                $or: [
                    { email: { $gt: email } },
                    {
                        $and: [
                            { firstName: { $gte: firstName } },
                            {
                                $or: [
                                    { firstName: { $gt: firstName } },
                                    {
                                        $and: [
                                            {
                                                lastName: { $gte: lastName }
                                            },
                                            {
                                                $or: [
                                                    { lastName: { $gt: lastName } },
                                                    { _id: { $lt: _id } }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
    expect(query[0]).toEqual(expectedResult)
})
