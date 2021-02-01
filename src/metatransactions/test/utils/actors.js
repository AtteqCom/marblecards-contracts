const config = require('../../config');

class Actor {
  constructor(token, uri, tokenUri, payment) {
    this.token = token;
    this.account = "0x0000000000000000000000000000000000000000";
    this.tokenUri = tokenUri;
    this.payment = payment;
    this.uri = uri;
  }
}

var actors = [
  new Actor(1, "https://en.wikipedia.org/wiki/Nipkow_disk", "rick.metadata.uri", parseInt(config.CANDIDATE_MINIMAL_PRICE)),
  new Actor(2, "https://en.wikipedia.org/wiki/114th_Fighter_Squadron", "morty.token.uri", parseInt(config.CANDIDATE_MINIMAL_PRICE) + 3),
  new Actor(3, "https://en.wikipedia.org/wiki/Barleria_prionitis", "summer.opensea.uri", parseInt(config.CANDIDATE_MINIMAL_PRICE) + 555),
  new Actor(4, "https://en.wikipedia.org/wiki/Consumer_sovereignty", "beth.opensea.uri", parseInt(config.CANDIDATE_MINIMAL_PRICE) + 7777),
  new Actor(5, "https://en.wikipedia.org/wiki/Duquesne_Dukes_women%27s_basketball", "jerry.cryptotatto.uri", parseInt(config.CANDIDATE_MINIMAL_PRICE) + 99999)
];

module.exports = actors;
