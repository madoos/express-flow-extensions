[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

# express-flow-extensions

_Set of tools to accelerate the development with express._

## Getting Started

To install:

    npm i --save express-flow-extensions

In your project:

```javascript
const expressFlowExtension = require('express-flow-extensions')
const { Joi, enableReturn, flow } = expressFlowExtension
const express = require('express')
const bodyParser = require('body-parser')
const R = require('ramda')
const authentication = require('./middleware/authentication')
const db = require('./db')

const app = expressFlowExtend(express())

app
.use(bodyParser.json())
.addRouters([
  {
    method: 'GET',
    path: '/posts',
    handler: enableReturn(() => db.findAllPosts())
  },
  {
    method: 'GET',
    path: '/tags/:postId',
    validation: {
      params: {
        postId: Joi.number().integer()
      }
    },
    middleware: [authentication],
    handler: flow(
      R.path(['params', 'postId']),
      db.findPostById,
      db.findTagsByPost
    )
  }
])

await app.listenAsync(300)
```

#

## License

MIT © [Maurice Domínguez](maurice.ronet.dominguez@gmail.com)

[npm-image]: https://badge.fury.io/js/express-flow-extensions.svg
[npm-url]: https://npmjs.org/package/express-flow-extensions
[travis-image]: https://travis-ci.org/madoos/express-flow-extensions.svg?branch=develop
[travis-url]: https://travis-ci.org/madoos/express-flow-extensions
[daviddm-image]: https://david-dm.org/madoos/express-flow-extensions.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/madoos/express-flow-extensions
[coveralls-image]: https://coveralls.io/repos/madoos/express-flow-extensions/badge.svg
[coveralls-url]: https://coveralls.io/r/madoos/express-flow-extensions
