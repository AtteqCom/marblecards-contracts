pragma solidity ^0.4.24;

library MarbleNFTLib{

    function getSourceUriHash(string _uri)
       public
       pure
       returns(uint256 marbledUriHash)
    {
       return uint256(keccak256(abi.encodePacked(_uri)));
    }
}
