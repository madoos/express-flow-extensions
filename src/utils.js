'use strict'

const httpStatus = require('http-status')
const isPromise = require('is-promise')

const _pipe = (...fns) => arg =>
  fns.reduce(async (value, fn) => fn(await value), arg)

const enableReturn = handler => {
  return function (req, res) {
    const data = handler(req)

    if (isPromise(data)) {
      return data
        .then(_data => res.status(httpStatus.OK).send(_data))
        .catch(err =>
          res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err.message)
        )
    }
    return res.status(httpStatus.OK).send(data)
  }
}

const flow = (...fns) => {
  return function (req, res) {
    const handler = _pipe(...fns)
    const controller = enableReturn(handler)
    return controller(req, res)
  }
}

module.exports = {
  flow,
  enableReturn
}
