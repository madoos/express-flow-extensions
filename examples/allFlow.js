'use strict'

const expressFlowExtend = require('../')
const { Joi, enableReturn, flow } = expressFlowExtend
const express = require('express')
const bodyParser = require('body-parser')
const R = require('ramda')

const app = expressFlowExtend(express())
app.use(bodyParser.json())

const authentication = (req, res, next) => next()
const db = {}

app.addRouters([
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
  }
])
