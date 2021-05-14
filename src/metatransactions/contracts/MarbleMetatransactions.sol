// SPDX-License-Identifier: MIT
pragma solidity 0.6.2;


import "./MarbleMetatransactionsInterface.sol";
import "./Ownable.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";


/// @title Metatransactions support for Marble.Card Dapp
/// @dev Since our original contracts do not support metatransactions, we have implemented this wrapper contract. 
///   We also need to use custom Ownable contract, because Ownable from openzeppelin contains _msgSender function which 
///   clashes with the one from BaseRelayRecipient contract.
contract MarbleMetatransactions is BaseRelayRecipient, MarbleMetatransactionsInterface, Ownable {

  /// @notice Address of the marbl nft factory contract
  MarbleNFTFactory public marbleNFTFactoryContract;

  /// @param _trustedForwarder Address of the forwarder which we trust (has permissions to execute functions on this contract)
  /// @param _marbleNFTFactoryContract Address of the marble nft factory contract
  constructor(address _trustedForwarder, MarbleNFTFactory _marbleNFTFactoryContract)
    public
  {
    trustedForwarder = _trustedForwarder;
		marbleNFTFactoryContract = _marbleNFTFactoryContract;
	}

  /// @notice Sets the trusted forwarder which has permissions to execute functions on this contract
  /// @param _trustedForwarder Address of the trusted forwarder
  function setTrustedForwarder(address _trustedForwarder)
    external
    onlyOwner
  {
    trustedForwarder = _trustedForwarder;
  }

  /// @notice Get version of this metatransactions contract
  /// @return The version
  function versionRecipient() 
    external 
    view
    override 
    returns (string memory) 
  {
    return "1";
  }

  /// @notice Creates page candidate using erc20 token for payment.
  /// @dev Creates page candidate using the given uri for the given user. The user needs to have enough tokens deposited in the erc20 bank which is used by the candidate contract.
  /// The full chain works as following:
  ///   ---> user A signs the transaction 
  ///   ---> relayer executes this method and extract address of A
  ///   ---> this method initiates candidate creation for A on the candidate contract (requires permission so it cannot be called by anyone and waste someone else's tokens)
  ///   ---> candidate contract issues payment to the bank contract (requires permission so it cannot be issued by anyone and waste someone else's tokens)
  ///   ---> if A has enough tokens in the bank, they are used to pay for the candidate creation (else it reverts)
  /// @param uri Uri of the candidate
  /// @param erc20Token Address of the token in which the candidate creation should be paid
  function createPageCandidateWithERC20(string calldata uri, address erc20Token) 
    override 
    external 
  {
    address issuer = _msgSender();
    marbleNFTFactoryContract.marbleNFTCandidateContract().createCandidateWithERC20ForUser(uri, erc20Token, issuer);
  }

  /// @notice Executes payment transaction on bank contract
  /// @dev The bank contract used is taken from the page candidate
  /// @param erc20Token Address of the token of the payment
  /// @param amount Amount of tokens t o be paid
  /// @param to Address to which the payment shold be sent
  /// @param note Note for the bank transaction
  function executeBankPayment(address erc20Token, uint256 amount, address to, string calldata note)
    override
    external
  {
    address sender = _msgSender();
    MarbleBank bank = marbleNFTFactoryContract.marbleNFTCandidateContract().erc20Bank();
    bank.payByAffiliate(erc20Token, amount, sender, to, note);
  }

  /// @notice Transfer NFT to another address
  /// @dev Transfers nft from its current owner to new owner. This requires that this contract is admin of the NFT contract and that the signer owns the given token
  /// @param toAddress Address of the new owner of the NFT
  /// @param tokenId Id of the token to be transfered
  function transferNft(address toAddress, uint256 tokenId) 
    override 
    external 
  {
    address issuer = _msgSender();
    marbleNFTFactoryContract.marbleNFTContract().forceApproval(tokenId, address(this));
    marbleNFTFactoryContract.marbleNFTContract().safeTransferFrom(issuer, toAddress, tokenId);
  }

  /// @notice Sets the marble nft factory contract
  /// @dev Can be called only by the owner of this contract
  function setMarbleFactoryContract(MarbleNFTFactory _marbleNFTFactoryContract) 
    override 
    external 
    onlyOwner 
  {
    marbleNFTFactoryContract = _marbleNFTFactoryContract;
  }

  /// @notice Puts the given NFT on auction If executed by the NFT owner
  /// @param nftId ID of the NFT token to be put on the auction
  /// @param startingPrice Initial price in the auction
  /// @param endingPrice Price at the end of the dynamic price phase of the auction and afterwards
  /// @param duration Duration of the dynamic price phase of the auction
  function startAuction(uint256 nftId, uint256 startingPrice, uint256 endingPrice, uint256 duration)
    override
    external
  {
    address issuer = _msgSender();
    marbleNFTFactoryContract.marbleDutchAuctionContract().createAuctionByMetatransaction(nftId, startingPrice, endingPrice, duration, issuer);
  }

  /// @notice Bids on an NFT if it is in an auction
  /// @dev If the bid is high enough, the auction is immediatelly finished and the NFT transfered to the bidder
  /// @param nftId ID of the NFT to bid on
  /// @param offer Bid offer in MBC wei
  function bidAuction(uint256 nftId, uint256 offer)
    override
    external
  {
    address issuer = _msgSender();
    marbleNFTFactoryContract.marbleDutchAuctionContract().bidByMetatransaction(nftId, offer, issuer);
  }

  /// @notice Cancels auction on given NFT if issued by the owner and not in the first phase of the initial auction
  /// @param nftId ID of the NFT whose auction is to be canceled
  function cancelAuction(uint256 nftId) 
    override
    external
  {
    address issuer = _msgSender();
    marbleNFTFactoryContract.marbleDutchAuctionContract().cancelAuctionByMetatransaction(nftId, issuer);
  }

  /// @notice Gets current price (in MBC wei) of a given NFT in an auction
  /// @param nftId ID of the queried NFT
  function getAuctionCurrentPrice(uint256 nftId)
    override
    external
    view
    returns(uint256)
  {
    return marbleNFTFactoryContract.marbleDutchAuctionContract().getCurrentPrice(nftId); 
  }

}
