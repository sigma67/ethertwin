pragma experimental ABIEncoderV2;

import "./auth/Roles.sol";
import "./auth/Attributes.sol";
import "./Specification.sol";
import "./ContractRegistry.sol";

contract Authorization {
    using Roles for Roles.Role;
    using Attributes for Attributes.Attribute;

    //RBAC roles
    enum RBAC {DEVICEAGENT, MANUFACTURER, OWNER, DISTRIBUTOR, MAINTAINER}

    enum PERMISSION { TWIN_CREATE, TWIN_UPDATE, TWIN_DELETE,
        DOC_CREATE, DOC_READ, DOC_UPDATE, DOC_DELETE,
        SENSOR_CREATE, SENSOR_READ, SENSOR_UPDATE, SENSOR_DELETE, SPECIFICATION_UPDATE}

    //events for removing and adding roles
    event RoleChanged(address indexed twin, address indexed operator, uint role, bool added);
    event AttributesChanged(address indexed twin, address indexed operator, bytes32[] attributes, bool added);
    event DeviceAgentChanged(address indexed operator);

    // local storage of the device agent address
    address public deviceAgentAddress;

    mapping(address => bool) public userRegistered;
    address[] public users;

    //map twin to mapping(role => users)
    mapping(address => mapping(uint => Roles.Role)) internal roleMapping;

    //on-chain permissions
    //map role to mapping(permission => bool)
    mapping(address => mapping(uint => mapping(uint => bool))) internal permissions;

    //on-chain permissions for components
    //map twin to mapping(attribute => users)
    mapping(address => mapping(bytes32 => Attributes.Attribute)) internal attributes;

    //this constructor defines the static address of the device agent at deployment
    constructor (address _deviceAgent) public payable
    {
        deviceAgentAddress = _deviceAgent;
    }

    function () external payable {}

    // is called by the ContractRegistry.sol --> initial step to register a device
    function initializeDevice(address _contract, address _operator, address _deviceAgent) external {
        //require(_operator == deviceAgentAddress, "You are not authorized to register devices.");
        roleMapping[_contract][uint(RBAC.OWNER)].add(_operator);
        roleMapping[_contract][uint(RBAC.DEVICEAGENT)].add(_deviceAgent);

        //initialize permissions - only true must be defined, default value is false
        permissions[_contract][uint(RBAC.DEVICEAGENT)][uint(PERMISSION.SENSOR_READ)] = true;
        permissions[_contract][uint(RBAC.DEVICEAGENT)][uint(PERMISSION.DOC_READ)] = true;
        permissions[_contract][uint(RBAC.DEVICEAGENT)][uint(PERMISSION.SENSOR_UPDATE)] = true;

        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.TWIN_CREATE)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.TWIN_UPDATE)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.TWIN_DELETE)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.DOC_CREATE)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.DOC_READ)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.DOC_UPDATE)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.DOC_DELETE)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.SENSOR_CREATE)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.SENSOR_READ)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.SENSOR_DELETE)] = true;
        permissions[_contract][uint(RBAC.OWNER)][uint(PERMISSION.SPECIFICATION_UPDATE)] = true;

        permissions[_contract][uint(RBAC.MANUFACTURER)][uint(PERMISSION.TWIN_CREATE)] = true;
        permissions[_contract][uint(RBAC.MANUFACTURER)][uint(PERMISSION.DOC_CREATE)] = true;
        permissions[_contract][uint(RBAC.MANUFACTURER)][uint(PERMISSION.DOC_READ)] = true;
        permissions[_contract][uint(RBAC.MANUFACTURER)][uint(PERMISSION.DOC_UPDATE)] = true;

        permissions[_contract][uint(RBAC.MAINTAINER)][uint(PERMISSION.DOC_CREATE)] = true;
        permissions[_contract][uint(RBAC.MAINTAINER)][uint(PERMISSION.DOC_READ)] = true;
        permissions[_contract][uint(RBAC.MAINTAINER)][uint(PERMISSION.DOC_UPDATE)] = true;
        permissions[_contract][uint(RBAC.MAINTAINER)][uint(PERMISSION.SENSOR_CREATE)] = true;

        permissions[_contract][uint(RBAC.DISTRIBUTOR)][uint(PERMISSION.DOC_CREATE)] = true;
        permissions[_contract][uint(RBAC.DISTRIBUTOR)][uint(PERMISSION.DOC_READ)] = true;
        permissions[_contract][uint(RBAC.DISTRIBUTOR)][uint(PERMISSION.DOC_UPDATE)] = true;
    }

    //registers user address and pays out Ether to conduct transactions
    function register() external {
        require(!userRegistered[msg.sender]);
        users.push(msg.sender);
        userRegistered[msg.sender] = true;
        //msg.sender.transfer(50 ether);
    }

    //////////
    // ROLES
    //////////

    //checks if an user has the given role for a specific contract
    function hasRole(address _operator, uint _role, address _contract) external view returns (bool){
        return roleMapping[_contract][_role].has(_operator);
    }

    // adds a role for an user for a specific specification contract
    function addRole(address _operator, uint _role, address _contract) public onlyOwner(_contract) {
        roleMapping[_contract][_role].add(_operator);
        emit RoleChanged(_contract, _operator, _role, true);
    }

    //update a user's own role
    function updateRole(uint _role, address _contract) external onlyOwner(_contract) {
        removeRole(msg.sender, _role, _contract);
        addRole(msg.sender, _role, _contract);
    }

    //removes an user of a role for a specific specification contract
    function removeRole(address _operator, uint _role, address _contract) public {
        require(roleMapping[_contract][uint(RBAC.OWNER)].has(msg.sender) ||
            roleMapping[_contract][_role].has(_operator), "You are not authorized to remove this role!");
        roleMapping[_contract][_role].remove(_operator);
        emit RoleChanged(_contract, _operator, _role, false);
    }

    // return the role of an user for a specific contract
    function getRole(address _operator, address _contract) public view returns (uint){
        if (roleMapping[_contract][uint(RBAC.OWNER)].has(_operator)) {
            return uint(RBAC.OWNER);
        } else if (roleMapping[_contract][uint(RBAC.MANUFACTURER)].has(_operator)) {
            return uint(RBAC.MANUFACTURER);
        } else if (roleMapping[_contract][uint(RBAC.MAINTAINER)].has(_operator)) {
            return uint(RBAC.MAINTAINER);
        } else if (roleMapping[_contract][uint(RBAC.DISTRIBUTOR)].has(_operator)) {
            return uint(RBAC.DISTRIBUTOR);
        } else if (roleMapping[_contract][uint(RBAC.DEVICEAGENT)].has(_operator)) {
            return uint(RBAC.DEVICEAGENT);
        }
        else {
            return 404;
        }
    }
    
    //return all users
    function getUsers() external view returns (address[] memory){
        return users; 
    }
    
    
    ///////////////
    // PERMISSIONS
    ///////////////

    function hasPermission(address _user, PERMISSION permission, address _contract) external view returns (bool){
        uint role = getRole(_user, _contract);
        return permissions[_contract][role][uint(permission)];
    }

    function hasPermissionAndAttribute(address _user, PERMISSION permission, bytes32 _component, address _contract) external view returns (bool){
        uint role = getRole(_user, _contract);
        //including the owner here removes the need to set all attributes for the owner
        return role == uint(RBAC.OWNER) || (permissions[_contract][role][uint(permission)] && attributes[_contract][_component].has(_user));
    }

    ///////////////
    // ATTRIBUTES
    ///////////////

    function addAttributes(address _user, bytes32[] calldata _components, address _contract) external onlyOwner(_contract) {
        require(_components.length > 0, "No attributes supplied");
        uint len = _components.length;
        for (uint i=0; i < len; i++) {
            attributes[_contract][_components[i]].add(_user);
        }
        emit AttributesChanged(_contract, _user, _components, true);
    }

    function removeAttributes(address _user, bytes32[] calldata _components, address _contract) external onlyOwner(_contract) {
        require(_components.length > 0, "No attributes supplied");
        uint len = _components.length;
        for (uint i=0; i < len; i++) {
            attributes[_contract][_components[i]].remove(_user);
        }
        emit AttributesChanged(_contract, _user, _components, false);
    }

    //check if a user has the given attribute for a specific contract
    function hasAttributes(address _user, bytes32[] calldata _components, address _contract) external view returns (bool[] memory){
        require(_components.length > 0, "No attributes supplied");
        bool[] memory checks = new bool[](_components.length);
        uint len = _components.length;
        for (uint i = 0; i < len; i++) {
            checks[i] = attributes[_contract][_components[i]].has(_user);
        }
        return checks;
    }

    // if the address of the device agent is changed, the old device agent can call this method to change the address
    function changeDeviceAgent(address _operator, address _contract) external onlyDeviceAgent(_contract) {
        addRole(_operator, uint(RBAC.DEVICEAGENT), _contract);
        removeRole(msg.sender, uint(RBAC.DEVICEAGENT), _contract);
        deviceAgentAddress = _operator;
        emit DeviceAgentChanged(_operator);
    }

    modifier onlyOwner(address _contract){
        require(roleMapping[_contract][uint(RBAC.OWNER)].has(msg.sender), "You are not authorized to change Twin roles.");
        _;
    }

    //modifier used for functions: only device agent can call method
    modifier onlyDeviceAgent(address _contract){
        require(isDeviceAgent() == true, "You do not have the permissions.");
        _;
    }

    // checks if the sender of this request is the device agent
    function isDeviceAgent() public view returns (bool)
    {
        return deviceAgentAddress == msg.sender;
    }
}
