'use strict'

const R = require('ramda')
const Promise = require('bluebird')
const celebrate = require('celebrate')
const validateJoiSchema = celebrate.celebrate
const validationJoiErrors = celebrate.errors

const _addRouters = R.curry((app, routers) => {
  routers.forEach(router => {
    const { method, path, handler, validation, middleware = [] } = router
    const normalizedMethod = method.toLowerCase()

    if (validation) {
      app[normalizedMethod](
        path,
        validateJoiSchema(validation),
        ...middleware,
        handler
      )
    } else {
      app[normalizedMethod](path, ...middleware, handler)
    }
  })

  app.use(validationJoiErrors())
  return app
})

const promisifyListen = app => {
  app.listenAsync = Promise.promisify(app.listen)
  return app
}

module.exports = function extend (app) {
  promisifyListen(app)
  app.addRouters = _addRouters(app)
  return app
}
