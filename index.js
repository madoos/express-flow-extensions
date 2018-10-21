const { Joi } = require('celebrate')
const {
  flow,
  enableReturn,
  createRouter,
  pipe,
  background,
  projection,
  middleware,
  withStatus
} = require('./src/utils')
const extendFlow = require('./src/extendFlow')

extendFlow.Joi = Joi
extendFlow.flow = flow
extendFlow.pipe = pipe
extendFlow.createRouter = createRouter
extendFlow.enableReturn = enableReturn
extendFlow.background = background
extendFlow.projection = projection
extendFlow.middleware = middleware
extendFlow.withStatus = withStatus
module.exports = extendFlow
