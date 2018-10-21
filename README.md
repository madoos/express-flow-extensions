# campusapp-express-extensions

_Set of tools to accelerate the development with express using a functional approach._

For more information see [manual/Usage](manual/Usage.md) and [manual/Documentation](manual/Documentation.md)

## Getting Started

To install:

    npm i --save campusapp-express-extensions

In your project:

```javascript
const expressExtensions = require('campusapp-express-extensions')
const { Joi, enableReturn, flow } = expressExtensions
const express = require('express')
const bodyParser = require('body-parser')
const R = require('ramda')
const authentication = require('./middleware/authentication')
const db = require('./db')

const app = expressExtensions(express())

cons opt = { type : 'get' }; //options for response and status server code

app
.use(bodyParser.json())
.addRouters([
  {
    method: 'GET',
    path: '/posts',
    handler: enableReturn(() => db.findAllPosts(),opt)
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
    handler: flow(opt,
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
