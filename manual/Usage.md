# Usage

The main utility of the library is facilitate the creation of endpoints in a declarative way.

To see the documentation of the utilities provided see [utilities documentation](Documentation.md)

Methods added to the instance of express:

* .listenAsync(port<Number>): Launch the server using promises
* .addRouters([Objects]): Declarative way to add routers

Features:

* Allows to add middleware
* Allows to validate input data with Joi schemes
* Provides a set of functions to compose express handlers with a functional approach
* Allows to launch the server with promises

## Declaring endpoints

```javascript
const expressExtensions = require('campusapp-express-extensions')
const express = require('express')
const app = expressExtensions(express())

app
.addRouters([
  {
    method: 'GET',
    path: '/:foo',
    handler: (req, res) => {
        res.send(req.params.foo)
    }
  },
  {
    method: 'POST',
    path: '/',
    handler: (req, res) => {
        res.send(req.body.baz)
    }
  }
])

await app.listenAsync(3000)
```

## Applying validation

The library provides a Joi object to apply input validations.
To enable validations use the validation property with a Joi schema.

```javascript
const expressExtensions = require('campusapp-express-extensions')
const { Joi } = expressExtensions
const express = require('express')
const app = expressExtensions(express())

app
.addRouters([{
    method: 'GET',
    path: '/foo/:baz',
    validation: {
      params: {
        baz: Joi.number().integer()
      }
    },
    ...
}])

await app.listenAsync(3000)
```

## Adding middleware

To add specific middleware for an endpoint use the middleware property passing an array as a value.

```javascript
const expressExtensions = require('campusapp-express-extensions')
const { Joi } = expressExtensions
const express = require('express')
const bodyParser = require('body-parser')
const app = expressExtensions(express())

app
.addRouters([{
    method: 'POST',
    path: '/foo',
    middleware: [bodyParser.json()],
    ...
}])

await app.listenAsync(3000)
```

## Custom responses codes

To handler the status code use the methods withStatus in the las part of pipeline.

```javascript
const handler = flow(
  R.prop("body"),
  db.findPostById,
  db.findTagsByPost,
  withStatus({
      200: (posts) => Array.isArray(posts),
      ...
  })

)
```

## Putting all together

```javascript
const expressExtensions = require('campusapp-express-extensions')
const { Joi, enableReturn, flow } = expressExtensions
const express = require('express')
const bodyParser = require('body-parser')
const R = require('ramda')
const authentication = require('./middleware/authentication')
const db = require('./db')

const app = expressExtensions(express())

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
  },
  {
    method: 'GET',
    path: '/tags',
    handler: (req, res) => {
        db.findAllTags()
        .then((tags) => res.send(tags))
    }
  }
])

await app.listenAsync(3000)
```
