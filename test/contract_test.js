const ContractRegistry = artifacts.require("ContractRegistry");
const Authorization = artifacts.require("Authorization");
const Specification = artifacts.require("Specification");


contract("ContractRegistry", accounts => {
  let c, s, hash, hashBytes;
  const component = "068ec45a-1002-4a75-8e27-21d8e0da6e3d";

  before(async () => {
    c = await ContractRegistry.deployed();
    hash = "0x40b46874c3ac6b4bfb7ed00aba8c0d0fbf9b3c8fece226f8f27b6f8446b6a0ee";
    hashBytes = web3.utils.hexToBytes(hash)
  });

  it("should create a new twin", async () => {
    let tx = await c.registerContract("12", "My Twin", hashBytes, accounts[1]);
    let contracts = await c.getContracts();
    s = await Specification.at(contracts[0]);
    assert.equal(contracts.length, 1, "Twin Specification Contract not deployed");
    let deviceAgent = await s.deviceAgent();
    assert.equal(deviceAgent, accounts[1], "Device Agent incorrect")
  });

  it("should add a new AML version", async () => {
    await s.addNewAMLVersion(hashBytes);
    let aml = await s.getAMLHistory();
    assert.equal(aml.length, 2, "Doc Version not created");
    assert.equal(aml[1].hash, hash, "Doc hash not equal");
  });

  it("should create a new document", async () => {
    await s.addDocument(component, "manual.pdf", "This is the asset manual.", hashBytes);
    let docs = await s.getDocument(component, 0);
    assert.equal(docs.versions[0].hash, hash, "Doc not created");
  });

  it("should add a new document version", async () => {
    await s.addDocumentVersion(component, 0, hashBytes);
    let docs = await s.getDocument(component, 0);
    assert.equal(docs.versions[1].hash, hash, "Doc Version not created");
  });

  it("should create a new sensor", async () => {
    await s.addSensor(component, "My Sensor", hashBytes);
    let sensors = await s.getSensor(component, 0);
    assert.equal(sensors.hash, hash, "Sensor not created");
  });

  it("should create a new external source", async () => {
    let myUri = "http://my-url.com:8080";
    await s.addExternalSource(myUri);
    let sources = await s.getExternalSource(0);
    assert.equal(sources.URI, myUri, "Source not created");
  });

  it("should add a program call", async () => {
    let call = "ConveyorVelocity(220)";
    await s.addProgramCall(component, call);
    let calls = await s.getProgramCallQueue(component);
    assert.equal(calls[0].call, call, "Call not created");
  });

  it("should update the program counter", async () => {
    await s.updateProgramCounter(component, 1);
    let counter = await s.getProgramCounter(component);
    assert.equal(counter.toNumber(), 1, "Counter not updated");
  });
});