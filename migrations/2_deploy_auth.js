var Authorization = artifacts.require("./Authorization.sol");

module.exports = function(deployer) {
  deployer.deploy(Authorization, "0x00a329c0648769a73afac7f9381e08fb43dbea72");
};
