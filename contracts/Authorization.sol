pragma experimental ABIEncoderV2;

import "../node_modules/openzeppelin-solidity/contracts/access/Roles.sol";
import "./Specification.sol";
import "./ContractRegistry.sol";

contract Authorization {
    using Roles for Roles.Role;

    //RBAC roles
    enum RBAC {DEVICEAGENT, MANUFACTURER, OWNER, DISTRIBUTOR, MAINTAINER}

    //events for removing and adding roles
    event RoleAdded(address indexed operator, uint role);
    event RoleRemoved(address indexed operator, uint role);
    event DeviceAgentChanged(address indexed operator);

    // local storage of the device agent address
    address public deviceAgentAddress;

    mapping(address => bool) userRegistered;
    address[] users;

    //map contract address to single roles for every contract
    mapping(address => mapping(uint => Roles.Role)) private roleMapping;

    //this constructor defines the static address of the device agent at deployment
    constructor (address _deviceAgent) public payable
    {
        deviceAgentAddress = _deviceAgent;
    }

    function () external payable {}

    // is called by the ContractRegistry.sol --> initial step to register a device
    function initializeDevice(address _operator, address _contract) public {
        //require(_operator == deviceAgentAddress, "You are not authorized to register devices.");
        roleMapping[_contract][uint(RBAC.OWNER)].add(_operator);
    }

    //registers user address and pays out Ether to conduct transactions
    function register() public {
        require(!userRegistered[msg.sender]);
        users.push(msg.sender);
        userRegistered[msg.sender] = true;
        msg.sender.transfer(50 ether);
    }

    //checks if an user has the given role for a specific contract
    function hasRole(address _operator, uint _role, address _contract) public view returns (bool){
        return roleMapping[_contract][_role].has(_operator);
    }

    // adds a role for an user for a specific specification contract
    function addRole(address _operator, uint _role, address _contract) public {
        if (_role == uint(RBAC.OWNER)) {
            //require(_operator == deviceAgentAddress, "You are not authorized to change the device agent.");
            emit RoleAdded(_operator, _role);
        }
        else {
            roleMapping[_contract][_role].add(_operator);
            emit RoleAdded(_operator, _role);
        }
    }

    //removes an user of a role for a specific specification contract
    function removeRole(address _operator, uint _role, address _contract) public {
        require(roleMapping[_contract][_role].has(_operator), "You do not have this role");
        roleMapping[_contract][_role].remove(_operator);
        emit RoleRemoved(_operator, _role);
    }

    // if the address of the device agent is changed, the old device agent can call this method to change the address
    function changeDeviceAgent(address _operator, address _contract) public onlyDeviceAgent(_contract) {
        addRole(_operator, uint(RBAC.DEVICEAGENT), _contract);
        removeRole(msg.sender, uint(RBAC.DEVICEAGENT), _contract);
        deviceAgentAddress = _operator;
        emit DeviceAgentChanged(_operator);
    }

    //modifier used for functions: only device agent can call method
    modifier onlyDeviceAgent(address _contract){
        require(isDeviceAgent() == true, "You do not have the permissions.");
        _;
    }

    //modifier used for functions: only authorized user who has a role in a contract can call
    modifier onlyAuthorizedAccounts(address _operator, address _contract){
        uint checkVal = getRole(_operator, _contract);
        require(roleMapping[_contract][checkVal].has(_operator), "You are not authorized.");
        _;
    }

    // return the role of an user for a specific contract
    function getRole(address _operator, address _contract) public view returns (uint){
        if (roleMapping[_contract][uint(RBAC.DEVICEAGENT)].has(_operator)) {
            return uint(RBAC.DEVICEAGENT);
        } else if (roleMapping[_contract][uint(RBAC.MANUFACTURER)].has(_operator)) {
            return uint(RBAC.MANUFACTURER);
        } else if (roleMapping[_contract][uint(RBAC.OWNER)].has(_operator)) {
            return uint(RBAC.OWNER);
        } else if (roleMapping[_contract][uint(RBAC.DISTRIBUTOR)].has(_operator)) {
            return uint(RBAC.DISTRIBUTOR);
        } else if (roleMapping[_contract][uint(RBAC.MAINTAINER)].has(_operator)) {
            return uint(RBAC.MAINTAINER);
        }
        else {
            return 404;
        }
    }

    // checks if the sender of this request is the device agent
    function isDeviceAgent() public view returns (bool)
    {
        return deviceAgentAddress == msg.sender;
    }
}