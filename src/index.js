const { promisify } = require('util')
const { _createRouter } = require('./utils')

module.exports = function extendFlow (app) {
  app.listenAsync = promisify(app.listen.bind(app))
  app.addRouters = _createRouter(app)
  return app
}
