var Authorization = artifacts.require("./Authorization.sol");
var Specification = artifacts.require("./Specification.sol");
var ContractRegistry = artifacts.require("./ContractRegistry.sol");

module.exports = function(deployer) {
  deployer.deploy(Specification, Authorization.address);
  deployer.deploy(ContractRegistry, Authorization.address);
};
