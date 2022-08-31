export const DESC = 'DESC'
export const ASC = 'ASC'

export const bota = (input) => (
    Buffer.from(input.toString(), 'binary').toString('base64')
)

export const atob = (input) => (
    Buffer.from(input, 'base64').toString('binary')
)

export const createCursorObject = (node, order) => (
    Object.keys(order).reduce((orderWithNodeValues, key) => ({
        ...orderWithNodeValues,
        [key]: [node[key] || null, order[key]],
    }), {})
)

export const createCursor = (node, order = {}) => {
    const cursorObject = createCursorObject(node, order)
    const cursorString = JSON.stringify(cursorObject)
    return bota(cursorString)
}

export const convertCursorToNodeId = (cursor) => {
    if (typeof cursor !== 'string') {
        return cursor
    }
    return parseInt(atob(cursor), 10)
}

export const cursorToObject = (cursor) => {
    const cursorString = atob(cursor)
    return JSON.parse(cursorString)
}

export const cursorToSqlQuery = (cursor, order) => {
    if (!cursor) {
        return Object.keys(order).reduce((acc, column, index, array) => {
            const orderQuery = acc[2] || ''
            const direction = order[column]
            const newOrder = `${orderQuery}"${column}" ${direction}`
            let orderPostfix = ', '
            const isLast = index === array.length - 1
            if (isLast) {
                orderPostfix = ''
            }
            const finalOrder = `${newOrder}${orderPostfix}`
            return [
                '',
                [],
                finalOrder,
            ]
        }, [])
    }
    const cursorObject = cursorToObject(cursor)
    return Object.keys(cursorObject).reverse().reduce((acc, column, index, array) => {
        const [value, direction] = cursorObject[column]
        const directionIsAsc = direction === ASC
        const directionFirst = directionIsAsc ? '>' : '<'
        const directionOne = directionIsAsc ? '>=' : '<='
        const directionTwo = directionIsAsc ? '>' : '<'
        const isFirst = index === 0
        const isLast = index === array.length - 1
        const finalValue = value
        const binding = array.length * 2
        const bindingOffset = index * 2
        const [whereQuery = '', values = [], orderQuery = ''] = acc
        // order by is in reverse order
        const orderIndex = array.length - index - 1
        const orderColumn = array[orderIndex]
        const orderDirection = cursorObject[orderColumn][1]
        const newOrder = `${orderQuery}"${orderColumn}" ${orderDirection}`
        let orderPostfix = ', '
        if (isLast) {
            orderPostfix = ''
        }
        const finalOrder = `${newOrder}${orderPostfix}`
        if (isFirst) {
            return [
                `"${column}" ${directionFirst} $${binding - 1}`,
                [finalValue],
                finalOrder,
            ]
        }
        return [
            `"${column}" ${directionOne} $${binding - (bindingOffset + 1)} AND ("${column}" ${directionTwo} $${binding - bindingOffset} OR (${whereQuery}))`,
            [finalValue, finalValue, ...values],
            finalOrder,
        ]
    }, [])
}

export const cursorToMongoQuery = (cursor) => {
    const cursorObject = cursorToObject(cursor)
    return Object.keys(cursorObject).reverse().reduce((query, column, index) => {
        const [value, direction] = cursorObject[column]
        const directionIsAsc = direction === ASC
        const directionFirst = directionIsAsc ? '$gt' : '$lt'
        const directionOne = directionIsAsc ? '$gte' : '$lte'
        const directionTwo = directionIsAsc ? '$gt' : '$lt'
        const isFirst = index === 0
        if (isFirst) {
            return {
                [column]: {
                    [directionFirst]: value,
                },
            }
        }
        return {
            $and: [{
                [column]: {
                    [directionOne]: value,
                },
            }, {
                $or: [{
                    [column]: {
                        [directionTwo]: value,
                    },
                }, query]
            }]
        }
    }, {})
}
