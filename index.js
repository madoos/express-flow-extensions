'use strict'

const { Joi } = require('celebrate')
const { flow, enableReturn } = require('./src/utils')
const extendFlow = require('./src/extendFlow')

extendFlow.Joi = Joi
extendFlow.flow = flow
extendFlow.enableReturn = enableReturn

module.exports = extendFlow
