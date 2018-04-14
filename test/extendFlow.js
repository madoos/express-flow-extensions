'use strict'

const { expect } = require('chai')
const R = require('ramda')
const express = require('express')
const bodyParser = require('body-parser')
const extendFlow = require('../')
const request = require('promisify-supertest')

describe('express-flow-extends', () => {
  it('Should import a function', () => {
    expect(extendFlow).to.be.a('function')
    expect(extendFlow.flow).to.be.a('function')
    expect(extendFlow.enableReturn).to.be.a('function')
    expect(extendFlow.Joi).to.be.a('object')
  })

  it('Should extend express', () => {
    const server = extendFlow(express())
    expect(server.addRouters).to.be.a('function')
  })

  it('Should add routers', async function () {
    const server = extendFlow(express())
    server.use(bodyParser.json())

    const responseBodyHandler = (req, res) => res.send(req.body)

    server.addRouters([
      {
        method: 'GET',
        path: '/get/test/:param',
        handler: (req, res) => res.send(req.params.param)
      },
      {
        method: 'POST',
        path: '/post/test',
        handler: responseBodyHandler
      },
      {
        method: 'PUT',
        path: '/put/test',
        handler: responseBodyHandler
      },
      {
        method: 'DELETE',
        path: '/delete/test',
        handler: responseBodyHandler
      }
    ])

    const api = request(server)
    const expectedData = { bar: 'foo' }

    const getData = await api
      .get('/get/test/foo')
      .expect(200)
      .end()

    expect(getData.text).to.equal('foo')

    const postData = await api
      .post('/post/test')
      .send(expectedData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end()

    expect(postData.body).to.deep.equal(expectedData)

    const deleteData = await api
      .delete('/delete/test')
      .send(expectedData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end()

    expect(deleteData.body).to.deep.equal(expectedData)

    const putData = await api
      .put('/put/test')
      .send(expectedData)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end()

    expect(putData.body).to.deep.equal(expectedData)
  })

  it('Should apply Joi validation', async function () {
    const { Joi } = extendFlow
    const server = extendFlow(express())
    server.use(bodyParser.json())

    const bodyValidation = Joi.object().keys({
      foo: Joi.string()
        .alphanum()
        .min(4)
        .required()
    })

    server.addRouters([
      {
        method: 'POST',
        path: '/validation',
        handler: (req, res) => res.send(req.body),
        validation: {
          body: bodyValidation
        }
      }
    ])

    const api = request(server)

    const koRequest = await api
      .post('/validation')
      .send({ foo: 'bar' }) // 3 instead of 4
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(400)
      .end()

    expect(koRequest.body.error).to.equal('Bad Request')

    const body = { foo: 'foo1bar' }
    const okRequest = await api
      .post('/validation')
      .send(body)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end()

    expect(okRequest.body).to.deep.equal(body)
  })

  it('.enableReturn with sync handler should send a correct response', async () => {
    const { enableReturn } = extendFlow
    const server = extendFlow(express())
    const syncHandler = req => ({ foo: req.params.foo })

    server.addRouters([
      {
        method: 'GET',
        path: '/sync/return/:foo',
        handler: enableReturn(syncHandler)
      }
    ])

    const api = request(server)
    const expectedBody = { foo: 'bar' }

    const syncResponse = await api
      .get('/sync/return/bar')
      .expect(200)
      .end()

    expect(expectedBody).to.deep.equal(syncResponse.body)
  })

  it('.enableReturn with async handler should send a correct response', async () => {
    const { enableReturn } = extendFlow
    const server = extendFlow(express())
    const asyncHandler = req => Promise.resolve({ foo: req.params.foo })

    server.addRouters([
      {
        method: 'GET',
        path: '/async/return/:foo',
        handler: enableReturn(asyncHandler)
      }
    ])

    const api = request(server)
    const expectedBody = { foo: 'bar' }

    const asyncResponse = await api
      .get('/async/return/bar')
      .expect(200)
      .end()

    expect(expectedBody).to.deep.equal(asyncResponse.body)
  })

  it('.flow should compose a correct handler', async () => {
    const { flow } = extendFlow
    const server = extendFlow(express())
    server.use(bodyParser.json())

    server.addRouters([
      {
        method: 'POST',
        path: '/flow',
        handler: flow(
          R.prop('body'),
          data => Promise.resolve(R.merge(data, { step2: 'async process' })),
          R.merge({ step3: 'sync process' }),
          data => Promise.resolve(R.merge(data, { step4: 'async process' }))
        )
      }
    ])

    const api = request(server)
    const expectedBody = {
      step1: 'body',
      step2: 'async process',
      step3: 'sync process',
      step4: 'async process'
    }

    const { body } = await api
      .post('/flow')
      .send({ step1: 'body' })
      .expect(200)
      .end()

    expect(expectedBody).to.deep.equal(body)
  })
})
