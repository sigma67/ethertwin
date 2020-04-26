pragma experimental ABIEncoderV2;
pragma solidity 0.5.13;

import "./Authorization.sol";

contract Specification {

    Authorization internal auth;
    address internal contractRegistry;

    string public deviceName;
    address public deviceAgent;
    address public owner;

    constructor (address payable _authAddress) public {
        auth = Authorization(_authAddress);
        contractRegistry = msg.sender;
    }

    //generic version blueprint for file stored on DHT
    struct Version {
        uint timestamp;
        address author;
        bytes32 hash;
    }

    struct Document {
        string name;
        string description;
        Version[] versions;
    }

    struct Sensor {
        string name;
        bytes32 hash;
    }

    struct ExternalSource {
        string URI;
        string description;
        address owner;
    }

    struct ProgramCall {
        uint timestamp;
        address author;
        string call;
    }

    Version[] public AML;
    ExternalSource[] public sources;

    //map hash of component to its documents
    mapping(bytes32 => Document[]) public documents;
    //map hash of component to its sensors
    mapping(bytes32 => Sensor[]) public sensors;
    //program calls for specific component
    mapping(bytes32 => ProgramCall[]) public programCallQueue;
    //array index of the most recently run program
    mapping(bytes32 => uint) public programCounter;

    function getTwin() external view returns (string memory, address, address){
        return (deviceName, deviceAgent, owner);
    }

    function updateTwin(string calldata _deviceName, address _deviceAgent, address _owner) external
    {
        require(msg.sender == contractRegistry || auth.hasPermission(msg.sender, Authorization.PERMISSION.TWIN_UPDATE, address(this)));
        deviceName = _deviceName;
        deviceAgent = _deviceAgent;
        owner = _owner;
    }

    //******* AML *******//

    //overload function with msg.sender variant, since Solidity does not support optional parameters
    function _addNewAMLVersion(bytes32 _newAMLVersion, address sender) external {
        // AML can be inserted by each role except unauthorized accounts
        require(!(auth.getRole(sender, address(this)) == 404), "Your account has no privileges");
        AML.push(Version(now, sender, _newAMLVersion));
    }

    function addNewAMLVersion(bytes32 _newAMLVersion) external {
        // AML can be inserted by each role except unauthorized accounts
        require(!(auth.getRole(msg.sender, address(this)) == 404), "Your account has no privileges");
        AML.push(Version(now, msg.sender, _newAMLVersion));
    }

    function getAML(uint id) external view returns (Version memory){
        return AML[id];
    }

    function getAMLCount() external view returns (uint){
        return AML.length;
    }

    function getAMLHistory() external view returns (Version[] memory){
        return AML;
    }

    //******* DOCUMENTS *******//

    //register a new document (always appends to the end)
    function addDocument(string calldata componentId, string calldata name, string calldata description, bytes32 docHash) external {
        bytes32 id = keccak256(bytes(componentId));
        require(auth.hasPermissionAndAttribute(msg.sender, Authorization.PERMISSION.DOC_CREATE, id, address(this)));

        documents[id].length++;
        Document storage doc = documents[id][documents[id].length - 1];
        doc.name = name;
        doc.description = description;
        doc.versions.push(Version(now, msg.sender, docHash));

        documents[id].push(doc);
        documents[id].length--;
    }

    //update Document storage metadata
    function updateDocument(string calldata componentId, uint documentId, string calldata name, string calldata description) external {
        bytes32 id = keccak256(bytes(componentId));
        require(auth.hasPermissionAndAttribute(msg.sender, Authorization.PERMISSION.DOC_UPDATE, id, address(this)));
        documents[id][documentId].name = name;
        documents[id][documentId].description = description;
    }

    //add new document version
    function addDocumentVersion(string calldata componentId, uint documentId, bytes32 docHash) external {
        bytes32 id = keccak256(bytes(componentId));
        require(auth.hasPermissionAndAttribute(msg.sender, Authorization.PERMISSION.DOC_UPDATE, id, address(this)));
        Version memory updated = Version(now, msg.sender, docHash);
        documents[id][documentId].versions.push(updated);
    }

    function getDocument(string calldata componentId, uint index) external view returns (Document memory){
        bytes32 id = keccak256(bytes(componentId));
        return documents[id][index];
    }

    function getDocumentCount(string calldata componentId) external view returns (uint){
        bytes32 id = keccak256(bytes(componentId));
        return documents[id].length;
    }

    function removeDocument(string calldata componentId, uint index) external {
        bytes32 id = keccak256(bytes(componentId));
        require(auth.hasPermissionAndAttribute(msg.sender, Authorization.PERMISSION.DOC_DELETE, id, address(this)));
        require(index < documents[id].length);
        documents[id][index] = documents[id][documents[id].length-1];
        delete documents[id][documents[id].length-1];
        documents[id].pop();
    }

    //******* SENSORS *******//

    function addSensor(string calldata componentId, string calldata name, bytes32 hash) external {
        bytes32 id = keccak256(bytes(componentId));
        require(auth.hasPermissionAndAttribute(msg.sender, Authorization.PERMISSION.SENSOR_CREATE, id, address(this)));
        sensors[id].push(Sensor(name, hash));
    }

    function getSensor(string calldata componentId, uint index) external view returns (Sensor memory){
        bytes32 id = keccak256(bytes(componentId));
        return sensors[id][index];
    }

    function getSensorCount(string calldata componentId) external view returns (uint){
        bytes32 id = keccak256(bytes(componentId));
        return sensors[id].length;
    }

    function removeSensor(string calldata componentId, uint index) external {
        bytes32 id = keccak256(bytes(componentId));
        require(auth.hasPermissionAndAttribute(msg.sender, Authorization.PERMISSION.SENSOR_DELETE, id, address(this)));
        require(index < sensors[id].length);
        sensors[id][index] = sensors[id][sensors[id].length-1];
        delete sensors[id][sensors[id].length-1];
        sensors[id].pop();
    }

    //******* EXTERNAL SOURCES *******//

    function addExternalSource(string calldata URI, string calldata description) external {
        sources.push(ExternalSource(URI, description, msg.sender));
    }

    function getExternalSource(uint index) external view returns (ExternalSource memory){
        return sources[index];
    }

    function getExternalSourceHistory() external view returns (ExternalSource[] memory){
        return sources;
    }

    function removeExternalSource(uint index) external {
        //todo permission check
        require(index < sources.length);
        sources[index] = sources[sources.length-1];
        delete sources[sources.length-1];
        sources.pop();
    }

    //******* PROGRAM CALLS *******//
    function addProgramCall(string calldata componentId, string calldata call) external {
        bytes32 id = keccak256(bytes(componentId));
        //todo permission check
        programCallQueue[id].push(ProgramCall(now, msg.sender, call));
    }

    function getProgramCallQueue(string calldata componentId) external view returns (ProgramCall[] memory){
        bytes32 id = keccak256(bytes(componentId));
        return programCallQueue[id];
    }

    function getProgramCounter(string calldata componentId) external view returns (uint){
        bytes32 id = keccak256(bytes(componentId));
        return programCounter[id];
    }

    function updateProgramCounter(string calldata componentId, uint counter) external {
        bytes32 id = keccak256(bytes(componentId));
        //todo permission check
        programCounter[id] = counter;
    }

}
