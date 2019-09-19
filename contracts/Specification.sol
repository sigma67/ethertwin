pragma experimental ABIEncoderV2;

import "./Authorization.sol";

contract Specification {

    Authorization auth;

    string public deviceName;
    string public deviceID;
    string[] public callProgramQueue;
    uint[] public documentArray;
    uint[] amlHistory;
    ExternalSource[] externalSources;

    constructor (address _authAddress) public {
        auth = Authorization(_authAddress);
    }
    struct Document {
        uint timestamp;
        string description;
        address documentOwner;
        string[] documentVersions;
    }

    struct AML {
        address sender;
        string content;
    }

    struct ExternalSource {
        string URI;
        address sourceOwner;
    }

    mapping(uint => Document) documents;
    mapping(string => string[]) documentVersions;
    //map aml addresses of each version or update
    mapping(uint => AML) amlVersioning;
    mapping(string => string) sensorFeeds;

    function updateSpecs(string memory _deviceID, string memory _deviceName, string memory _deviceAML, address _operator) public
    {
        deviceID = _deviceID;
        deviceName = _deviceName;
        uint timestamp = now;
        amlVersioning[timestamp].sender = _operator;
        amlVersioning[timestamp].content = _deviceAML;

        amlHistory.push(timestamp);
        // insertAML(_amlParts);
    }
    //returns all docs of the specification contract
    // TODO -- beware of doc version!
    function getDocumentArray() public view returns (uint[] memory){
        // AML can be inserted by each role except unauthorized accounts
        require(!(auth.getRole(msg.sender, address(this)) == 404), "Your account has no privileges");
        return documentArray;
    }

    function createNewAMLVersion(string memory _newAMLVersion) public {
        uint timestamp = now;
        amlVersioning[timestamp].sender = msg.sender;
        amlVersioning[timestamp].content = _newAMLVersion;

        amlHistory.push(timestamp);
    }

    function getAML(uint timestamp) public view returns (address, string memory){
        return (amlVersioning[timestamp].sender, amlVersioning[timestamp].content);
    }

    function getAllAMLInfos() public view returns (uint[] memory)
    {
        return amlHistory;
    }
}
