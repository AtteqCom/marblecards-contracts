// SPDX-License-Identifier: MIT
pragma solidity 0.7.0;


import "./EIP712MetaTransaction.sol";
import "./MarbleMetatransactionsInterface.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



/**
 * @title MarbleMetatransactions
 * @dev Contract allowing metatransactions for Marble Dapp.
 */
contract MarbleMetatransactions is EIP712MetaTransaction, MarbleMetatransactionsInterface, Ownable {

  MarbleNFTFactory public marbleNFTFactoryContract;

  /**
   * @param transactionsFromChainId only transactions from this chain will be supported.
   */
  constructor(MarbleNFTFactory _marbleNFTFactoryContract, uint transactionsFromChainId) 
    EIP712MetaTransaction("MarbleCards test", "1", transactionsFromChainId) 
  {
		marbleNFTFactoryContract = _marbleNFTFactoryContract;
	}

  /**
   * @dev Creates page candidate using the given uri for the given user. The user needs to have enough tokens
   * deposited in the erc20 bank which is used by the candidate contract.
   * The full chain works as following:
   *   ---> user A signs the transaction 
   *   ---> relayer executes this method and extract address of A
   *   ---> this method initiates candidate creation for A on the candidate contract (requires permission so it cannot be called by anyone and waste someone's tokens)
   *   ---> candidate contract issues payment to the bank contract (requires permission so it cannot be issued by anyone and waste someone else's permissions)
   *   ---> if A has enough tokens in the bank, they are used to pay for the candidate creation (else it reverts)
   * @param uri candidate's uri
   * @param erc20Token token in which the candidate creation should be paid 
   */
  function createPageCandidateWithERC20(string calldata uri, address erc20Token) override external {
    address issuer = msgSender();
    marbleNFTFactoryContract.marbleNFTCandidateContract().createCandidateWithERC20ForUser(uri, erc20Token, issuer);
  }

  /**
   * @dev Transfers nft from its current owner to new owner. This requires that this contract is admin of the NFT contract.
   * @param toAddress new owner of the NFT
   * @param tokenId id of the token to be transfered
   */
  function transferNft(address toAddress, uint256 tokenId) override external {
    address issuer = msgSender();

    marbleNFTFactoryContract.marbleNFTContract().forceApproval(tokenId, address(this));
    marbleNFTFactoryContract.marbleNFTContract().safeTransferFrom(issuer, toAddress, tokenId);
  }

  /**
   * @dev Sets the marble nft factory contract.
   */
  function setMarbleFactoryContract(MarbleNFTFactory _marbleNFTFactoryContract) override external onlyOwner {
    marbleNFTFactoryContract = _marbleNFTFactoryContract;
  }

}
