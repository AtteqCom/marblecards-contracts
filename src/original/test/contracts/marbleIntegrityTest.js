const MarbleNFTCandidate = artifacts.require("./MarbleNFTCandidate.sol");
const MarbleNFTFactory = artifacts.require("./MarbleNFTFactory.sol");
const MarbleNFT = artifacts.require("./MarbleNFT.sol");
const MarbleDutchAuction = artifacts.require("./MarbleDutchAuction.sol");

contract("MarbleIntegrityTest", accounts => {
  console.log("Integrity test - started");
  const [firstAccount, secondAccount] = accounts;
  console.log("Accounts used:");
  console.log(firstAccount);
  console.log(secondAccount);

  let auction,
    factory,
    nft,
    candidate;

  before(async () => {
    console.log("Before Test: getting contracts");
    auction = await MarbleDutchAuction.deployed();
    factory = await MarbleNFTFactory.deployed();
    nft = await MarbleNFT.deployed();
    candidate = await MarbleNFTCandidate.deployed();
  });

  it("NFT Factory has reference to deployed NFT contract", async () => {
    assert.equal(await factory.marbleNFTContract(), nft.address);
  });
  it("NFT Factory has reference to deployed NFT Candidate contract", async () => {
    assert.equal(await factory.marbleNFTCandidateContract(), candidate.address);
  });
  it("NFT Factory has reference to deployed Clock Auction contract", async () => {
    assert.equal(await factory.marbleNFTCandidateContract(), candidate.address);
  });
  it("NFT Factory is admin of NFT contract", async () => {
    assert.equal(await nft.isAdmin(factory.address),true);
  });
  it("NFT Factory is admin of NFT Candidate contract", async () => {
    assert.equal(await candidate.isAdmin(factory.address),true);
  });
  it("NFT Factory is admin of Marble Clock Auction contract", async () => {
    assert.equal(await auction.isAdmin(factory.address),true);
  });
  it("Dutch Auction has reference to deployed NFT contract", async () => {
    assert.equal(await auction.nftContract(), nft.address);
  });
  it("Dutch Auction is admin of NFT contract", async () => {
    assert.equal(await nft.isAdmin(auction.address),true);
  });

});
