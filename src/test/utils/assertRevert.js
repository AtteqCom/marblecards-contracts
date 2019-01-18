const logger = require('./logger');

module.exports = async (promise) => {
  try {
    await promise;
    assert.fail('Expected revert not received');
  } catch (error) {
    logger.log("ERROR message:");
    logger.log(error.message);
    logger.log("---------------");
    logger.log("ERROR reason:");
    logger.log(error.reason);
    logger.log("---------------");
    const revertFound = error.message.search('revert') >= 0;
    assert(revertFound, `Expected "revert", got ${error} instead`);
  }
};
