pragma experimental ABIEncoderV2;
pragma solidity 0.5.13;

import "./auth/Roles.sol";
import "./Specification.sol";
import "./Authorization.sol";

contract ContractRegistry {
    event TwinCreated(address owner, bytes32 aml, address deviceAgent);
    address[] public contracts;

    Authorization internal auth;
    Specification internal spec;

    constructor (address payable _auth) public {
        auth = Authorization(_auth);
    }

    function registerContract(string calldata _deviceID, string calldata _deviceName, bytes32 _deviceAML, address _deviceAgent) external returns(address) {

        //require RBAC.DEVICEAGENT PRIVILEGES --> device agent has value 0
        //require(auth.getRole(msg.sender, address(this)) == 0, "Your account has no privileges of device agent!");
        spec = new Specification(address(auth));

        //get address of new specification instance
        address contractAddress = address(spec);

        // set role for contract owner
        auth.initializeDevice(contractAddress, msg.sender, _deviceAgent);

        //set params in the specification contract
        spec.updateTwin(_deviceID, _deviceName, _deviceAgent, msg.sender);

        //add AML to specification contract
        spec._addNewAMLVersion(_deviceAML, msg.sender);

        //add contract to all contracts
        contracts.push(contractAddress);

        emit TwinCreated(msg.sender, _deviceAML, _deviceAgent);

        return contractAddress;
    }

    function getContracts() external view returns (address[] memory){
        return contracts;
    }

}