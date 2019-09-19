pragma experimental ABIEncoderV2;

import "../node_modules/openzeppelin-solidity/contracts/access/Roles.sol";
import "./Specification.sol";
import "./Authorization.sol";

contract ContractRegistry {

    address[] public contracts;

    address[] public amlsTmp;

    Authorization auth;
    Specification spec;

    constructor (address _auth) public {
        auth = Authorization(_auth);
    }
    function registerContract(string memory _deviceID, string memory _deviceName, string memory _deviceAML) public {

        //require RBAC.DEVICEAGENT PRIVILEGES --> device agent has value 0
        //require(auth.getRole(msg.sender, address(this)) == 0, "Your account has no privileges of device agent!");
        spec = new Specification(address(auth));

        //get address of new specification instance
        address contractAddress = address(spec);

        // set role for contract --> device agent
        auth.initializeDevice(msg.sender, contractAddress);

        //set params in the specification contract
        spec.updateSpecs(_deviceID, _deviceName, _deviceAML, msg.sender);

        //add contract to all contracts
        contracts.push(contractAddress);
    }

    function getContracts() public view returns (address[] memory){
        return contracts;
    }

}