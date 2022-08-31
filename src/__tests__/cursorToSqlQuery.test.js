import {
    ASC,
    DESC,
    createCursor,
    cursorToSqlQuery,
} from '../index'

test('if \'cursorToSqlQuery\' return correct values.', async () => {
    const id = 1
    const firstName = 'dries'
    const lastName = 'vdm'
    const user = {
        id,
        firstName,
        lastName,
    }
    const orderBy = {
        id: DESC,
    }
    const cursor = createCursor(user, orderBy)
    const query = cursorToSqlQuery(cursor, orderBy)
    const expectedResult = [
        '"id" < $1',
        [id],
        '"id" DESC',
    ]
    expect(query).toEqual(expectedResult)
})

test('if \'cursorToSqlQuery\' return correct values.', async () => {
    const id = 1
    const firstName = 'dries'
    const lastName = 'vdm'
    const user = {
        id,
        firstName,
        lastName,
    }
    const orderBy = {
        firstName: ASC,
        lastName: DESC,
        id: DESC,
    }
    const cursor = createCursor(user, orderBy)
    const query = cursorToSqlQuery(cursor, orderBy)
    const expectedResult = [
        '"firstName" >= $1 AND ("firstName" > $2 OR ("lastName" <= $3 AND ("lastName" < $4 OR ("id" < $5))))',
        [firstName, firstName, lastName, lastName, id],
        '"firstName" ASC, "lastName" DESC, "id" DESC'
    ]
    expect(query).toEqual(expectedResult)
})

test('if \'cursorToSqlQuery\' return correct values.', async () => {
    const id = 1
    const firstName = 'dries'
    const lastName = 'vdm'
    const email = 'dries@vdm.be'
    const user = {
        id,
        firstName,
        lastName,
        email,
    }
    const orderBy = {
        email: ASC,
        firstName: ASC,
        lastName: ASC,
        id: DESC,
    }
    const cursor = createCursor(user, orderBy)
    const query = cursorToSqlQuery(cursor, orderBy)
    const expectedResult = [
        '"email" >= $1 AND ("email" > $2 OR ("firstName" >= $3 AND ("firstName" > $4 OR ("lastName" >= $5 AND ("lastName" > $6 OR ("id" < $7))))))',
        [email, email, firstName, firstName, lastName, lastName, id],
        '"email" ASC, "firstName" ASC, "lastName" ASC, "id" DESC',
    ]
    expect(query).toEqual(expectedResult)
})

test('if \'cursorToSqlQuery\' return correct values when no cursor is provided.', async () => {
    const orderBy = {
        id: DESC,
    }
    const query = cursorToSqlQuery(null, orderBy)
    const expectedResult = [
        '',
        [],
        '"id" DESC',
    ]
    expect(query).toEqual(expectedResult)
})
