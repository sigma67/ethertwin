var Web3 = require("../node_modules/web3/");
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
var Authorization = artifacts.require("./Authorization.sol");

module.exports = function(deployer, network, accounts) {
  let funding = network !== 'ropsten' ? '10000' : '0';

  deployer.deploy(
    Authorization,
    "0x00a329c0648769a73afac7f9381e08fb43dbea72",
    {
      from: accounts[0],
      value: web3.utils.toWei(funding, "ether")
    });
};
