pragma solidity ^0.5.13;


import "./EIP712MetaTransaction.sol";
import "./MarbleMetatransactionsInterface.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";


contract MarbleNFT {
  function forceApproval(uint256 _tokenId, address _approved) external;
  function safeTransferFrom(address from, address to, uint256 tokenId) external;
  function transferFrom(address from, address to, uint256 tokenId) external;
}

contract MarbleNFTCandidate {
    function createCandidateWithERC20ForUser(string calldata _uri, address _erc20, address _owner) external returns(uint256 index);
}

contract MarbleNFTFactory {
  MarbleNFT public marbleNFTContract;
  MarbleNFTCandidate public marbleNFTCandidateContract;
}

/**
 * @title MarbleMetatransactions
 * @dev Contract allowing metatransactions for Marble Dapp.
 */
contract MarbleMetatransactions is EIP712MetaTransaction, MarbleMetatransactionsInterface {

  MarbleNFTFactory public marbleNFTFactoryContract;

  /**
   * @param transactionsFromChainId only transactions from this chain will be supported.
   */
  constructor(MarbleNFTFactory _marbleNFTFactoryContract, uint transactionsFromChainId) public EIP712MetaTransaction("MarbleCards test", "1", transactionsFromChainId) {
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
  function createPageCandidateWithERC20(string calldata uri, address erc20Token) external {
    address issuer = msgSender();
    marbleNFTFactoryContract.marbleNFTCandidateContract().createCandidateWithERC20ForUser(uri, erc20Token, issuer);
  }

  /**
   * @dev Transfers nft from its current owner to new owner. This requires that this contract is admin of the NFT contract.
   * @param toAddress new owner of the NFT
   * @param tokenId id of the token to be transfered
   */
  function transferNft(address toAddress, uint256 tokenId) external {
    address issuer = msgSender();
    
    marbleNFTFactoryContract.marbleNFTContract().forceApproval(tokenId, address(this));
    marbleNFTFactoryContract.marbleNFTContract().safeTransferFrom(issuer, toAddress, tokenId);
  }

}
