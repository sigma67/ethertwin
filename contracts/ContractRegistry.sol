pragma experimental ABIEncoderV2;
pragma solidity ^0.5.12;

import "../node_modules/openzeppelin-solidity/contracts/access/Roles.sol";
import "./Specification.sol";
import "./Authorization.sol";

contract ContractRegistry {

    address[] public contracts;

    Authorization auth;
    Specification spec;

    constructor (address payable _auth) public {
        auth = Authorization(_auth);
    }

    function registerContract(string memory _deviceID, string memory _deviceName, bytes32 _deviceAML, address _deviceAgent) public returns(address) {

        //require RBAC.DEVICEAGENT PRIVILEGES --> device agent has value 0
        //require(auth.getRole(msg.sender, address(this)) == 0, "Your account has no privileges of device agent!");
        spec = new Specification(address(auth));

        //get address of new specification instance
        address contractAddress = address(spec);

        // set role for contract owner
        auth.initializeDevice(msg.sender, contractAddress);

        //set params in the specification contract
        spec.updateTwin(_deviceID, _deviceName, _deviceAgent);

        //add AML to specification contract
        spec.addNewAMLVersion(_deviceAML);

        //add contract to all contracts
        contracts.push(contractAddress);

        return contractAddress;
    }

    function getContracts() public view returns (address[] memory){
        return contracts;
    }

}