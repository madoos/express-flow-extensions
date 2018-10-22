const R = require('ramda')
const httpStatus = require('http-status')
const isFunction = R.is(Function)
const { celebrate, errors } = require('celebrate')
const { Router } = require('express')
const statusProtocol = Symbol('status')

/**
 *
 * Composes synchronous and asynchronous functions, returning as a final result a promise.
 * @example
 *
 * const plus = (n) => n + 1
 * const asyncDouble = (n) => Promise.resolve(n*2)
 * const result = await pipe(plus, asyncDouble)(2) // => 4
 *
 * @param {...Function} fns functions to compose.
 * @return {Function}
 */

const pipe = (...fns) => arg =>
  fns.reduce(async (value, fn) => fn(await value), arg)

/**
 *
 * Allows to use synchronous or asynchronous functions with return to respond with the express response object.
 * @example
 * // Using function
 *
 * const handler = enableReturn((req) => `foo ${req.params.baz}` )
 * app.get('/', handler)
 * // in get request '/baz', server response 'foo baz'
 *
 * // Using Array
 *
 * const handlers = enableReturn([(req) => `foo ${req.params.baz}`])
 * app.get('/', handler[0])
 * // in get request '/baz', server response 'foo baz'
 *
 * // Using Object
 *
 * const handlers = enableReturn({
 *      baz: (req) => `foo ${req.params.baz}`
 * })
 *
 * app.get('/', handler.baz)
 * // in get request '/baz', server response 'foo baz'
 *
 *  // Configure response to get more information see Usage Custom response
 *
 * const handlers = enableReturn((req) => `foo ${req.params.baz}`, { type: 'get'})
 *
 * app.get('/', handler.baz)
 * // in get request '/baz', server response 'foo baz'
 *
 * @param {Function|Array|Object} handler
 * @return {Function} requestHandler Response with res object.
 */

const enableReturn = handler => {
  return async function requestHandler (req, res) {
    try {
      const data = await handler(req)

      return !!data && data[statusProtocol]
        ? res.status(data[statusProtocol]).send(data.data)
        : res.send(data)
    } catch (err) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err.message)
    }
  }
}

/**
 * return status with a declarative style
 * @example
 * flow(..., withStatus({
 *   200: R.complement(R.isEmpty) // <- will return 200 if data is not empty
 *   ...
 * }))
 * @param {Object} descriptor object with a set of conditions to test data with
 * @param {Object} data object to test descriptor conditions
 * @returns {Object} containing data and first status that matched its condition
 */
const withStatus = R.curry((descriptor, data) => {
  let statusMatched
  let statusCodes = Object.keys(descriptor)
  for (let i = 0; i < statusCodes.length; i++) {
    let status = statusCodes[i]
    let isSelectedStatus = descriptor[status]
    if (isSelectedStatus(data)) {
      statusMatched = status
      break
    }
  }

  if (!statusMatched) {
    throw new Error(`undefined status check withStatus descriptor`)
  }

  return {
    data,
    [statusProtocol]: statusMatched
  }
})

/**
 *
 * Compose sync or async functions and respond using the object of express.
 * If the request is successful send as status code 200 otherwise status code 500 and message error.
 * @example
 *
 * const getNumberInParam = (req) => req.params.n
 * const plus = (n) => n + 1
 * const asyncDouble = (n) => Promise.resolve(n*2)
 * const handler = flow(getNumberInParam, plus, asyncDouble)
 *
 * app.get('/', handler) // in get request '/2', server response 6
 *
 * @param {...Function} fns
 * @returns {Function} Composed handler
 */

const flow = (...fns) => {
  return (req, res) => {
    const handler = pipe(...fns)
    const controller = enableReturn(handler)
    return controller(req, res)
  }
}

const _createRouter = R.curry((target, routers) => {
  routers.forEach(router => {
    const { method, path, handler, validation, middleware = [] } = router
    const normalizedMethod = method.toLowerCase()

    if (validation) {
      target[normalizedMethod](
        path,
        celebrate(validation),
        ...middleware,
        handler
      )
    } else {
      target[normalizedMethod](path, ...middleware, handler)
    }
  })

  target.use(errors())
  return target
})

/**
 *
 * Create an express router object adding the specified routes for each object.
 * @example
 *
 * const api = createRouter([{
 *    method: 'GET',
 *    path: '/:bar',
 *    handler: (req, res) => {
 *       res.send(req.params.bar)
 *    }
 *  }])
 *
 * app.use('api', apiRouter)

 * @param {Array.<Object>} routes
 * @returns {Object} Express Router instance
 */

const createRouter = routes => {
  return _createRouter(Router(), routes)
}

// _path :: (String || [String]) => {} => a
const _path = R.useWith(R.path, [
  R.ifElse(R.is(String), R.split('.'), R.identity)
])

/**
 *
 * Transforms the keys of one object into another, it is very useful to obtain data from the request object. the method is currified.
 * @example
 *
 *  const descriptor = {
 *      id: 'req.params.id',
 *      age: 'req.body.age',
 *      isAdult: (req) => req.body.age > 18
 *  }
 *  const data = projection(descriptor, req)
 *
 * // Using curry
 *
 *  const data = projection({
 *      id: 'req.params.id',
 *      age: 'req.body.age',
 *      isAdult: (req) => req.body.age > 18
 *  })(req)
 *
 * @param {Object} descriptor
 * @param {Object} src
 * @return {Object} The object modeled with the descriptor paths.
 */
const projection = R.curry((descriptor, src) =>
  R.map(getter => {
    if (isFunction(getter)) {
      return getter(src)
    }
    return _path(getter, src)
  }, descriptor)
)
/**
 *
 * Create a express middleware.
 * @example
 *
 * const isAdult = (age) => age > 18
 *
 * const validateAge = middleware({
 *      handler: isAdult,
 *      getter: 'params.age',
 *      target: '__is_adult__'
 * })
 *
 * app.get('/:age', validateAge, (req, res) => res.send(req.__is_adult__))
 * // in get request '/21', server response true
 *
 * @param {Object} definition { handler, target, getter }
 * @param {Function} definition.handler Async or sync function to put into middleware.
 * @param {String} definition.target Property name to add to request object.
 * @param {Function|String} definition.getter Property or function to get data ass argument to pass to the handler function.
 * @returns {Function} Express middleware.
 */

const middleware = function ({ handler, target, getter }) {
  return async function (req, res, next) {
    try {
      const params = isFunction(getter) ? getter(req) : req[getter]
      const result = await handler(params)
      req[target] = result
      next()
    } catch (e) {
      next(e)
    }
  }
}

/**
 *
 * Execute a function in background (is an alias for tap combinator).
 * @example
 *
 * const getNumberInParam = (req) => req.params.n
 * const plus = (n) => n + 1
 * const asyncDouble = (n) => Promise.resolve(n*2)
 * const handler = flow(getNumberInParam, plus, asyncDouble)
 *
 * app.get('/', flow(
 *  getNumberInParam,
 *  plus,
 *  background((n) => console.log('result of plus:', n))
 *  asyncDouble
 * ))
 * @param {Function} f
 * @returns {Function}
 */

const background = R.tap

module.exports = {
  _createRouter,
  flow,
  enableReturn: R.ifElse(isFunction, enableReturn, R.map(enableReturn)),
  createRouter,
  pipe,
  projection,
  background,
  middleware,
  withStatus
}
