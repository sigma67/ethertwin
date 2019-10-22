pragma experimental ABIEncoderV2;
pragma solidity ^0.5.12;

import "./Authorization.sol";

contract Specification {

    Authorization auth;

    string public deviceName;
    string public deviceID;
    address public deviceAgent;

    constructor (address _authAddress) public {
        auth = Authorization(_authAddress);
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

    function getTwin() public view returns (string memory, string memory, address){
        return (deviceName, deviceID, deviceAgent);
    }

    function updateTwin(string memory _deviceID, string memory _deviceName, address _deviceAgent) public
    {
        deviceID = _deviceID;
        deviceName = _deviceName;
        deviceAgent = _deviceAgent;
    }

    //******* AML *******//

    function addNewAMLVersion(bytes32 _newAMLVersion) public {
        // AML can be inserted by each role except unauthorized accounts
        // must use tx.origin since it is also called from ContractRegistry
        require(!(auth.getRole(tx.origin, address(this)) == 404), "Your account has no privileges");
        AML.push(Version(now, tx.origin, _newAMLVersion));
    }

    function getAML(uint id) public view returns (Version memory){
        return AML[id];
    }

    function getAMLCount() public view returns (uint){
        return AML.length;
    }

    function getAMLHistory() public view returns (Version[] memory){
        return AML;
    }

    //******* DOCUMENTS *******//

    //register a new document (always appends to the end)
    function addDocument(string memory componentId, string memory name, string memory description, bytes32 docHash) public {
        bytes32 id = keccak256(bytes(componentId));
        //todo access control based on component

        documents[id].length++;
        Document storage doc = documents[id][documents[id].length - 1];
        doc.name = name;
        doc.description = description;
        doc.versions.push(Version(now, msg.sender, docHash));

        documents[id].push(doc);
        documents[id].length--;
    }

    //update Document storage metadata
    function updateDocument(string memory componentId, uint documentId, string memory name, string memory description) public {
        bytes32 id = keccak256(bytes(componentId));
        documents[id][documentId].name = name;
        documents[id][documentId].description = description;
    }

    //add new document version
    function addDocumentVersion(string memory componentId, uint documentId, bytes32 docHash) public {
        bytes32 id = keccak256(bytes(componentId));
        Version memory updated = Version(now, msg.sender, docHash);
        documents[id][documentId].versions.push(updated);
    }

    function getDocument(string memory componentId, uint index) public view returns (Document memory){
        bytes32 id = keccak256(bytes(componentId));
        return documents[id][index];
    }

    function getDocumentCount(string memory componentId) public view returns (uint){
        bytes32 id = keccak256(bytes(componentId));
        return documents[id].length;
    }

    //******* SENSORS *******//

    function addSensor(string memory componentId, string memory name, bytes32 hash) public {
        bytes32 id = keccak256(bytes(componentId));
        //todo permission check
        sensors[id].push(Sensor(name, hash));
    }

    function getSensor(string memory componentId, uint index) public view returns (Sensor memory){
        bytes32 id = keccak256(bytes(componentId));
        return sensors[id][index];
    }

    function getSensorCount(string memory componentId) public view returns (uint){
        bytes32 id = keccak256(bytes(componentId));
        return sensors[id].length;
    }

    function removeSensor(string memory componentId) public {
        bytes32 id = keccak256(bytes(componentId));
        //todo permission check
        delete(sensors[id]);
    }

    //******* EXTERNAL SOURCES *******//

    function addExternalSource(string memory URI) public {
        //todo permission check
        sources.push(ExternalSource(URI, msg.sender));
    }

    function getExternalSource(uint index) public view returns (ExternalSource memory){
        return sources[index];
    }

    function getExternalSourceHistory() public view returns (ExternalSource[] memory){
        return sources;
    }

    function removeExternalSource(uint index) public {
        //todo permission check
        delete(sources[index]);
    }

    //******* PROGRAM CALLS *******//
    function addProgramCall(string memory componentId, string memory call) public {
        bytes32 id = keccak256(bytes(componentId));
        //todo permission check
        programCallQueue[id].push(ProgramCall(now, msg.sender, call));
    }

    function getProgramCallQueue(string memory componentId) public view returns (ProgramCall[] memory){
        bytes32 id = keccak256(bytes(componentId));
        return programCallQueue[id];
    }

    function getProgramCounter(string memory componentId) public view returns (uint){
        bytes32 id = keccak256(bytes(componentId));
        return programCounter[id];
    }

    function updateProgramCounter(string memory componentId, uint counter) public {
        bytes32 id = keccak256(bytes(componentId));
        //todo permission check
        programCounter[id] = counter;
    }

}
