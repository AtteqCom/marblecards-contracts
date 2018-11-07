
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
  new Actor(1, "https://en.wikipedia.org/wiki/Nipkow_disk", "rick.metadata.uri", 20000000000), // 20 GWei
  new Actor(2, "https://en.wikipedia.org/wiki/114th_Fighter_Squadron", "morty.token.uri", 40000000000), // 40 GWei
  new Actor(3, "https://en.wikipedia.org/wiki/Barleria_prionitis", "summer.opensea.uri", 30000000000), // 30 GWei
  new Actor(4, "https://en.wikipedia.org/wiki/Consumer_sovereignty", "beth.opensea.uri", 10000000000), // 10 GWei
  new Actor(5, "https://en.wikipedia.org/wiki/Duquesne_Dukes_women%27s_basketball", "jerry.cryptotatto.uri", 50000000000) // 50 GWei
];

module.exports = actors;
