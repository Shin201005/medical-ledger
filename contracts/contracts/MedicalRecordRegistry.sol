// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
/// @notice V4: encrypted IPFS CID + hash on chain, no plaintext clinical data or keys.
contract MedicalRecordRegistry {
    address public immutable sysAdmin;
    uint256 public constant VERSION = 4;
    mapping(address => bool) public isHospitalIssuer;
    mapping(address => bool) public isHealthInspector;
    mapping(address => bytes32) public walletScope;
    event WalletScopeChanged(address indexed wallet,bytes32 scope);
    function setWalletScope(address wallet,bytes32 scope) external onlyAdmin {require(wallet!=address(0),"ZERO_WALLET");walletScope[wallet]=scope;emit WalletScopeChanged(wallet,scope);}
    struct Record { bytes32 organizationScope; bytes32 recordHash; string ipfsCid; address holder; address issuer; uint64 createdAt; bool invalidated; }
    mapping(bytes32 => Record) private records;
    mapping(bytes32 => mapping(address => uint64)) public accessConsents;
    event RecordIssued(bytes32 indexed codeHash, bytes32 recordHash, address indexed issuer, string ipfsCid);
    event ConsentGranted(bytes32 indexed codeHash, address indexed doctor, uint64 expiresAt);
    event RecordInvalidated(bytes32 indexed codeHash, address indexed inspector);
    event RoleChanged(address indexed wallet, uint8 role, bool enabled);
    modifier onlyAdmin(){require(msg.sender == sysAdmin,"ADMIN_ONLY");_;}
    constructor(){sysAdmin=msg.sender;}
    function setHospitalRole(address wallet,bool enabled) external onlyAdmin {require(wallet!=address(0),"ZERO_WALLET");isHospitalIssuer[wallet]=enabled;emit RoleChanged(wallet,1,enabled);}
    function setInspectorRole(address wallet,bool enabled) external onlyAdmin {require(wallet!=address(0),"ZERO_WALLET");isHealthInspector[wallet]=enabled;emit RoleChanged(wallet,2,enabled);}
    function issueMedicalRecord(bytes32 codeHash,bytes32 recordHash,address holder,string calldata ipfsCid) external {
        require(isHospitalIssuer[msg.sender],"ISSUER_ONLY");require(holder!=address(0)&&recordHash!=bytes32(0)&&codeHash!=bytes32(0),"INVALID_RECORD");
        require(bytes(ipfsCid).length>0&&bytes(ipfsCid).length<=128,"INVALID_CID");
        require(records[codeHash].createdAt==0,"DUPLICATE_RECORD");
        require(walletScope[msg.sender]!=bytes32(0),"ISSUER_SCOPE_REQUIRED");
        records[codeHash]=Record(walletScope[msg.sender],recordHash,ipfsCid,holder,msg.sender,uint64(block.timestamp),false);
        emit RecordIssued(codeHash,recordHash,msg.sender,ipfsCid);
    }
    function grantDoctorAccess(bytes32 codeHash,address doctor,uint64 duration) external {
        Record storage rec=records[codeHash];require(rec.holder==msg.sender,"HOLDER_ONLY");require(!rec.invalidated,"INVALIDATED");
        require(doctor!=address(0)&&duration>0&&duration<=30 days,"INVALID_CONSENT");
        uint64 expiry=uint64(block.timestamp)+duration; accessConsents[codeHash][doctor]=expiry;emit ConsentGranted(codeHash,doctor,expiry);
    }
    function revokeDoctorAccess(bytes32 codeHash,address doctor) external {
        require(records[codeHash].holder==msg.sender,"HOLDER_ONLY");delete accessConsents[codeHash][doctor];emit ConsentGranted(codeHash,doctor,0);
    }
    function invalidateRecord(bytes32 codeHash) external {
        require(isHealthInspector[msg.sender],"MANAGER_ONLY");Record storage rec=records[codeHash];require(rec.createdAt!=0,"NOT_FOUND");require(walletScope[msg.sender]!=bytes32(0)&&walletScope[msg.sender]==rec.organizationScope,"MANAGER_SCOPE_FORBIDDEN");require(!rec.invalidated,"ALREADY_INVALIDATED");rec.invalidated=true;emit RecordInvalidated(codeHash,msg.sender);
    }
    function verifyMedicalRecord(bytes32 codeHash) external view returns(bool exists,bool invalidated,bytes32 recordHash,uint64 createdAt){
        Record memory r=records[codeHash];return(r.createdAt!=0,r.invalidated,r.recordHash,r.createdAt);
    }
    function recordCid(bytes32 codeHash) external view returns(string memory){return records[codeHash].ipfsCid;}
    function hasAccess(bytes32 codeHash,address viewer) external view returns(bool){
        Record memory r=records[codeHash];return r.createdAt!=0&&!r.invalidated&&(viewer==r.holder||viewer==r.issuer||accessConsents[codeHash][viewer]>block.timestamp);
    }
}
