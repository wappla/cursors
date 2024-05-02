type Node = Record<string, any>

export const DESC = 'DESC'
export const ASC = 'ASC'

export const bota = (input: string | Buffer): string => (
    Buffer.from(input.toString(), 'binary').toString('base64')
);

export const atob = (input: string): string => (
    Buffer.from(input, 'base64').toString('binary')
);

export const createCursorObject = (node: Node, order) => (
    Object.keys(order).reduce((orderWithNodeValues, key) => {
        const direction = order[key]?.direction || order[key]
        const column = order[key]?.column || key
        return {
            ...orderWithNodeValues,
            [key]: [node[key] || null, direction, column],
        }
    }, {})
)

export const createCursor = (node: Node, order = {}) => {
    const cursorObject = createCursorObject(node, order)
    const cursorString = JSON.stringify(cursorObject)
    return bota(cursorString)
}

export const cursorToObject = (cursor: string) => {
    const cursorString = atob(cursor)
    return JSON.parse(cursorString)
}

export const cursorToSqlQuery = (cursor: string | null, order): [string, any[], string] => {
    if (!cursor) {
        return Object.keys(order).reduce((acc, column, index, array) => {
            const orderQuery = acc[2] || ''
            const direction = order[column]?.direction || order[column]
            const orderColumn = order[column]?.column || column
            const newOrder = `${orderQuery}"${orderColumn}" ${direction}`
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
        }, ['', [], ''])
    }
    const cursorObject = cursorToObject(cursor)
    return Object.keys(cursorObject).reverse().reduce((acc, currentColumn, index, array) => {
        const [value, direction] = cursorObject[currentColumn]
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
        const newOrderColumn = cursorObject[orderColumn][2]
        const currentColumnAlias = cursorObject[currentColumn][2] || currentColumn
        const newOrder = `${orderQuery}"${newOrderColumn}" ${orderDirection}`
        let orderPostfix = ', '
        if (isLast) {
            orderPostfix = ''
        }
        const finalOrder = `${newOrder}${orderPostfix}`
        if (isFirst) {
            return [
                `"${currentColumnAlias}" ${directionFirst} $${binding - 1}`,
                [finalValue],
                finalOrder,
            ]
        }
        return [
            `"${currentColumnAlias}" ${directionOne} $${binding - (bindingOffset + 1)} AND ("${currentColumnAlias}" ${directionTwo} $${binding - bindingOffset} OR (${whereQuery}))`,
            [finalValue, finalValue, ...values],
            finalOrder,
        ]
    }, ['', [], ''])
}

export const cursorToMongoQuery = (cursor: string) => {
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
