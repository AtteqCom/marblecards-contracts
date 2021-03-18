const AuthContract = artifacts.require("./MarbleBankWithdrawAuthorization.sol");

const truffleAssert = require('truffle-assertions');


contract("MarbleBankWithdrawAuthorization", (accounts) => {

  let authContract;
  const mockTokenAddress = "0xEe16AA4416c055C9b14bB76Bb0Bd2BDF115F56AE";

  const owner = accounts[0];
  const nozdormu = accounts[1];
  const ysera = accounts[2];

  beforeEach(async () => {
    authContract = await AuthContract.new();
  })

  describe("canWithdraw function", () => {

    it("by default should return false when not added to the whitelist", async () => {
      const result = await authContract.canWithdraw(owner, mockTokenAddress, 50);
      assert.isFalse(result, "Should be false when not whitelisted");
    });

    it("returns true after added to whitelist", async () => {
      await authContract.addToWhitelist(nozdormu)
      const result = await authContract.canWithdraw(nozdormu, mockTokenAddress, 100);

      assert.isTrue(result, "Should be true when added to the whitelist");
    });

    it("returns false when added to the whitelist and then removed", async () => {
      await authContract.addToWhitelist(ysera);
      assert.isTrue(await authContract.canWithdraw(ysera, mockTokenAddress, 500), "Should be true when added to the whitelist");
      await authContract.removeFromWhitelist(ysera);
      assert.isFalse(await authContract.canWithdraw(ysera, mockTokenAddress, 100), "Should be false when removed from the whitelist");
    })

  })

  describe("addToWhitelist function", async () => {
    it("reverts when not executed from the owner address", async () => {
      await truffleAssert.reverts(
        authContract.addToWhitelist(ysera, { from: nozdormu })
      )
    })

    it("emits correct event", async () => {
      const response = await authContract.addToWhitelist(nozdormu);

      truffleAssert.eventEmitted(response, 'AddedToWhitelist', { 
        userAddress: nozdormu
      });
    })

    it("actually adds the use to the whitelist", async () => {
      await authContract.addToWhitelist(ysera);
      assert.isTrue(await authContract.whitelist(ysera), "Should be added to the whitelist")
    })

    it("revertes when already added", async () => {
      await authContract.addToWhitelist(ysera);

      truffleAssert.reverts(
        authContract.addToWhitelist(ysera),
        "User already whitelisted"
      )
    })
  })

  describe("removeFromWhitelist function", async () => {
    it("reverts when not executed from the owner address", async () => {
      await truffleAssert.reverts(
        authContract.removeFromWhitelist(ysera, { from: nozdormu })
      )
    })

    it("emits correct event", async () => {
      await authContract.addToWhitelist(nozdormu);

      const response = await authContract.removeFromWhitelist(nozdormu);

      truffleAssert.eventEmitted(response, 'RemovedFromWhitelist', { 
        userAddress: nozdormu
      });
    })

    it("actually removes the use from the whitelist", async () => {
      await authContract.addToWhitelist(ysera);
      assert.isTrue(await authContract.whitelist(ysera), "Should be in the whitelist")

      await authContract.removeFromWhitelist(ysera);
      assert.isFalse(await authContract.whitelist(ysera), "Should be removed from the whitelist")
    })

    it("reverts when not in the list", async () => {
      truffleAssert.reverts(
        authContract.removeFromWhitelist(ysera),
        "User not whitelisted"
      )
    })
  })

})