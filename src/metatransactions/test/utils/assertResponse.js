const logger = require('./logger');

module.exports = (txResponse, expectedResponse, message = "") => {
  for (const expectedKey in expectedResponse) {
    assert(expectedKey in txResponse, `Expected key ${expectedKey} not present in the actual response`);

    assert.equal(
      getAssertingValue(txResponse[expectedKey]), 
      getAssertingValue(expectedResponse[expectedKey]), 
      message?
      `${message}: response property '${expectedKey}' expected to have value ${expectedResponse[expectedKey]}, but the actual was ${txResponse[expectedKey]}`
      :
      `Response property '${expectedKey}' expected to have value ${expectedResponse[expectedKey]}, but the actual was ${txResponse[expectedKey]}`
    )
  }
};

function getAssertingValue(val) {
  if (val.constructor.name === 'BN') {
    return val.toString();
  }

  return val;
}
