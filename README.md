# Dashdot Cursors

[![build](https://img.shields.io/github/workflow/status/wappla/cursors/Build?style=flat&colorA=000000&colorB=000000)](https://github.com/wappla/cursors/actions/workflows/on_push_main.yml)
[![codecov](https://img.shields.io/codecov/c/github/wappla/cursors?style=flat&colorA=000000&colorB=000000)](https://codecov.io/gh/wappla/cursors)

An simple SQL and Mongo implementation of cursor based pagination

## Usage

Inside your Node project directory, run the following:

```sh
npm i --save @dashdot/cursors
```

Or with Yarn:

```sh
yarn add @dashdot/cursors
```

## API

```javascript
import { cursorToSqlQuery } from '@dashdot/cursor'
import * as tables from './tables'

const user = await tables.users().fist()
const cursor = createCursor(user, orderBy)
const [
    whereQuery,
    whereValues,
    orderQuery
]  = cursorToSqlQuery(cursor)
const nextUser = await tables.users()
    .whereRaw(whereQuery, whereValues)
    .orderByRaw(orderQuery)
    .first()
```