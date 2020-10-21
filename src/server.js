'use strict';

require('dotenv').config();

const defaults = require('./defaults');

const {
  CACHE_TTL = defaults.cacheTtl,
  HELMET_CONFIG = '{}',
  NODE_ENV,
  PORT = defaults.appPort,
} = process.env;

const
  compression = require('compression'),
  bodyParser = require('body-parser'),
  express = require('express'),
  helmet = require('helmet'),
  logger = require('heroku-logger'),
  path = require('path'),
  rp = require('request-promise'),
  { isEmptyObject } = require('./helpers'),
  { forceDomainSSL, unless , middlewareSecurity } = require('./middleware');

const shouldCompress = (req, res) => {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false;
  }
  return compression.filter(req, res);
};

const urlOptions = (delay) => ({
  uri: `https://httpbin.org/delay/${delay}`,
  headers: {
    'User-Agent': 'SampleApp/1.0'
  },
  json: true
});

const helmetConfig = () => {

  const helmetConfigDefault = require('./defaults').helmetConfig;

  let localConfig = JSON.parse(HELMET_CONFIG) || {};

  try {
    localConfig = require('../.helmet.local');
  } catch (err) { /* */ }

  return !isEmptyObject(localConfig)
    ? Object.assign({}, helmetConfigDefault, localConfig)
    : helmetConfigDefault;
};

const app = express();

app
  .use(forceDomainSSL)
  .use(helmet(helmetConfig()))
  .use(compression({ filter: shouldCompress, level: 6 }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .set('view options', { rmWhitespace: true })
  .use(express.static('public'))
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .use((req, res, next) => {
    res.locals.req = req;
    res.locals.pageData = {};
    next();
  });

app.get('/', (req, res, next) => {
  const dateStr = (new Date()).toLocaleString();
  const pageData = `${dateStr} - ${req.header('host')}`;
  res.send(pageData);
});

app.get('/ping', (req, res, next) => {
  res.send('pong');
});

app.get('/test', (req, res, next) => {
  const dateStr = (new Date()).toLocaleString();
  const pageData = `${dateStr} - ${req.header('host')}`;
  res.locals.pageTitle = 'Home';
  res.locals.subTemplate = 'pages/test';
  res.locals.subTemplateJS = [
    'pages/test_js'
  ];
  res.locals.pageData = pageData;
  next();
});

app.post('/remotedata/:delay([0-9]+)', (req, res, next) => {
  const delay = Math.min((parseInt(req.params.delay) || 5), 10);
  rp(urlOptions(delay))
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      logger.error(err+'');
    });
});

app.use((req, res, next) => {
  res.render('main', {});
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app.listen(PORT, async () => {
  if (NODE_ENV !== 'test') {
    logger.info(`Web worker ${process.pid} started, listening on port ${PORT}`);
  }
});
