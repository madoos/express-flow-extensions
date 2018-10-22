const { Joi } = require('celebrate')
const extendFlow = require('./src')
const utils = require('./src/utils')

module.exports = Object.assign(extendFlow, utils, { Joi })
