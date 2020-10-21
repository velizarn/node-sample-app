'use strict';

/**
 * Default values for .env variables and global app vars
 */
module.exports = {

  sessionCookieId: 'sid',

  sessionCookieTtl: 30, // min

  sessionCookieSecret: 'NCiplUEZ',

  cacheTtl: 86400, // sec

  cacheExpiryTime: 1200, // sec (i.e. 20 min)

  appPort: 5000,

  helmetConfig: {
    frameguard: {
      action: 'deny'
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\''],
        baseUri: ['\'self\''],
        fontSrc: ['\'self\'', 'https:'],
        frameAncestors: ['\'self\''],
        imgSrc: ['\'self\'', 'data:'],
        objectSrc: ['\'none\''],
        scriptSrc: ['\'self\'', '\'unsafe-inline\''],
        styleSrc: ['\'self\'', '\'unsafe-inline\''],
        // upgradeInsecureRequests: []
      },
    }
  }
};
