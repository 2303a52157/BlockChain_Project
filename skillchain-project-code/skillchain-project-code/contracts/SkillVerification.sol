// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Blockchain-Based Student Skill Verification
/// @notice Stores the SHA-256 hash of admin-approved certificates.
///         Full PDFs stay off-chain (MongoDB / file storage).
contract SkillVerification {
    struct SkillRecord {
        bytes32 fileHash;     // SHA-256 of the approved PDF
        address approvedBy;   // admin wallet that approved it
        uint256 approvedOn;   // block timestamp
        bool active;          // false once revoked
    }

    address public owner;
    mapping(address => bool) public isAdmin;
    mapping(string => SkillRecord) private records;   // certId => record
    mapping(string => bool) private exists;           // duplicate guard

    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event SkillRecorded(string certId, bytes32 fileHash, address indexed approvedBy, uint256 approvedOn);
    event SkillRevoked(string certId, address indexed revokedBy);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not an authorised admin");
        _;
    }

    constructor() {
        owner = msg.sender;
        isAdmin[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }

    // ---------- admin management ----------
    function addAdmin(address a) external onlyOwner {
        isAdmin[a] = true;
        emit AdminAdded(a);
    }

    function removeAdmin(address a) external onlyOwner {
        isAdmin[a] = false;
        emit AdminRemoved(a);
    }

    // ---------- write functions (admin only) ----------
    function recordSkill(string calldata certId, bytes32 fileHash) external onlyAdmin {
        require(bytes(certId).length > 0, "Empty certificate ID");
        require(!exists[certId], "Duplicate certificate ID");

        records[certId] = SkillRecord({
            fileHash: fileHash,
            approvedBy: msg.sender,
            approvedOn: block.timestamp,
            active: true
        });
        exists[certId] = true;

        emit SkillRecorded(certId, fileHash, msg.sender, block.timestamp);
    }

    function revokeSkill(string calldata certId) external onlyAdmin {
        require(exists[certId], "Record not found");
        records[certId].active = false;
        emit SkillRevoked(certId, msg.sender);
    }

    // ---------- read-only (free, no gas) ----------
    /// @return found   certificate ID exists on-chain
    /// @return valid   found && hash matches && not revoked
    /// @return active  record has not been revoked
    function checkSkill(string calldata certId, bytes32 fileHash)
        external
        view
        returns (bool found, bool valid, bool active)
    {
        if (!exists[certId]) return (false, false, false);
        SkillRecord storage r = records[certId];
        return (true, r.active && r.fileHash == fileHash, r.active);
    }

    function getRecord(string calldata certId)
        external
        view
        returns (bytes32 fileHash, address approvedBy, uint256 approvedOn, bool active)
    {
        require(exists[certId], "Record not found");
        SkillRecord storage r = records[certId];
        return (r.fileHash, r.approvedBy, r.approvedOn, r.active);
    }
}
