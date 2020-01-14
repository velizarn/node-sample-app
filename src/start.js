/* eslint no-unused-vars: 0 */
/* eslint no-undef: 0 */
'use strict';

require('dotenv').config();

const {
  NODE_ENV,
  WEB_CONCURRENCY
} = process.env;

const 
  argv = require('yargs').argv,
  cluster = require('cluster'),
  logger = require('heroku-logger');  

const WORKERS = WEB_CONCURRENCY || require('os').cpus().length;

const worker = () => {

  switch (argv.process) {
  case 'server':
  default:
    require('./server');
    break;
  }
  logger.info(`Job worker ${process.pid} started`);
};

if (NODE_ENV !== 'test') {

  if (cluster.isMaster) {

    logger.info(`Master process ${process.pid} is running`);

    for (let i = 0, p = Promise.resolve(); i < WORKERS; i++) {
      p = p.then(_ => new Promise(resolve => {
        cluster.fork();
        resolve();
      }));
    }

    cluster.on('exit', (worker, code, signal) => {
      logger.info(`Worker ${worker.process.pid} died`);
      cluster.fork();
    });

  } else {
    worker();
  }
  
} else {
  worker();
}
