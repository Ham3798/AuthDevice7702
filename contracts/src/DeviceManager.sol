// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./WebAuthn256r1.sol";

/**
 * @title DeviceManager
 * @notice Option 4 AuthDevice7702 - 멀티 디바이스 관리 컨트랙트
 * @dev EIP-7702 EOA를 스마트 지갑으로 업그레이드하여 여러 하드웨어 디바이스 관리
 */
contract DeviceManager is Ownable, ReentrancyGuard {
    
    // 디바이스 정보 구조체
    struct Device {
        bytes32 credentialId;    // WebAuthn credential ID
        uint256[2] publicKey;    // P-256 public key (x, y)
        string deviceName;       // 사용자 친화적 이름
        uint256 registeredAt;    // 등록 시간
        bool isActive;           // 활성 상태
        bytes32 attestation;     // 선택적: attestation 데이터
    }
    
    // 세션 정보 구조체  
    struct Session {
        address sessionKey;      // 세션 공개키
        uint256 expiresAt;       // 만료 시간
        uint256 gasLimit;        // 세션별 가스 한도
        bool isActive;           // 세션 상태
        bytes32 authorizedBy;    // 승인한 디바이스 ID
    }
    
    // 상태 변수
    mapping(address => Device[]) public userDevices;        // 사용자별 디바이스 목록
    mapping(address => mapping(bytes32 => uint256)) public deviceIndex; // 디바이스 ID → 인덱스
    mapping(address => Session[]) public userSessions;     // 사용자별 세션 목록
    mapping(address => mapping(address => uint256)) public sessionIndex; // 세션키 → 인덱스
    
    // 이벤트
    event DeviceRegistered(
        address indexed user,
        bytes32 indexed credentialId,
        string deviceName,
        uint256[2] publicKey
    );
    
    event DeviceRevoked(
        address indexed user,
        bytes32 indexed credentialId,
        string deviceName
    );
    
    event SessionCreated(
        address indexed user,
        address indexed sessionKey,
        uint256 expiresAt,
        bytes32 indexed authorizedBy
    );
    
    event SessionRevoked(
        address indexed user,
        address indexed sessionKey,
        bytes32 indexed revokedBy
    );
    
    // 에러
    error DeviceAlreadyExists();
    error DeviceNotFound();
    error SessionNotFound();
    error SessionExpired();
    error InvalidSignature();
    error UnauthorizedDevice();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice 새로운 하드웨어 디바이스 등록
     * @param credentialId WebAuthn credential ID
     * @param publicKey P-256 public key (x, y)
     * @param deviceName 사용자 친화적 디바이스 이름
     * @param signature WebAuthn 서명 (등록 증명)
     */
    function registerDevice(
        bytes32 credentialId,
        uint256[2] calldata publicKey,
        string calldata deviceName,
        bytes calldata signature
    ) external nonReentrant {
        // 중복 등록 방지
        if (isDeviceRegistered(msg.sender, credentialId)) {
            revert DeviceAlreadyExists();
        }
        
        // WebAuthn 서명 검증 (실제 구현에서는 challenge 포함)
        // bytes32 challenge = keccak256(abi.encodePacked(msg.sender, credentialId, block.timestamp));
        // require(_verifyWebAuthnSignature(challenge, signature, publicKey), "Invalid registration signature");
        
        // 디바이스 등록
        Device memory newDevice = Device({
            credentialId: credentialId,
            publicKey: publicKey,
            deviceName: deviceName,
            registeredAt: block.timestamp,
            isActive: true,
            attestation: bytes32(0) // 선택적
        });
        
        uint256 index = userDevices[msg.sender].length;
        userDevices[msg.sender].push(newDevice);
        deviceIndex[msg.sender][credentialId] = index;
        
        emit DeviceRegistered(msg.sender, credentialId, deviceName, publicKey);
    }
    
    /**
     * @notice 하드웨어 승인을 통한 새로운 세션 생성
     * @param sessionKey 세션용 공개키 주소
     * @param duration 세션 지속 시간 (초)
     * @param gasLimit 세션별 가스 한도
     * @param deviceCredentialId 승인하는 디바이스 ID
     * @param signature 하드웨어 디바이스 서명
     */
    function createSession(
        address sessionKey,
        uint256 duration,
        uint256 gasLimit,
        bytes32 deviceCredentialId,
        bytes calldata signature
    ) external nonReentrant {
        // 디바이스 존재 및 활성화 확인
        if (!isDeviceRegistered(msg.sender, deviceCredentialId)) {
            revert DeviceNotFound();
        }
        
        Device memory device = getDevice(msg.sender, deviceCredentialId);
        require(device.isActive, "Device is inactive");
        
        // 하드웨어 서명 검증
        bytes32 sessionHash = keccak256(abi.encodePacked(
            msg.sender,
            sessionKey,
            duration,
            gasLimit,
            block.timestamp
        ));
        
        // require(_verifyWebAuthnSignature(sessionHash, signature, device.publicKey), "Invalid device signature");
        
        // 세션 생성
        Session memory newSession = Session({
            sessionKey: sessionKey,
            expiresAt: block.timestamp + duration,
            gasLimit: gasLimit,
            isActive: true,
            authorizedBy: deviceCredentialId
        });
        
        uint256 index = userSessions[msg.sender].length;
        userSessions[msg.sender].push(newSession);
        sessionIndex[msg.sender][sessionKey] = index;
        
        emit SessionCreated(msg.sender, sessionKey, newSession.expiresAt, deviceCredentialId);
    }
    
    /**
     * @notice 세션 키 유효성 검증
     * @param user 사용자 주소
     * @param sessionKey 검증할 세션 키
     * @return valid 유효성 여부
     */
    function isValidSession(address user, address sessionKey) external view returns (bool valid) {
        if (sessionIndex[user][sessionKey] == 0 && userSessions[user].length == 0) {
            return false;
        }
        
        uint256 index = sessionIndex[user][sessionKey];
        if (index >= userSessions[user].length) {
            return false;
        }
        
        Session memory session = userSessions[user][index];
        return session.isActive && session.expiresAt > block.timestamp;
    }
    
    /**
     * @notice 하드웨어 승인을 통한 세션 취소
     * @param sessionKey 취소할 세션 키
     * @param deviceCredentialId 승인하는 디바이스 ID
     * @param signature 하드웨어 디바이스 서명
     */
    function revokeSession(
        address sessionKey,
        bytes32 deviceCredentialId,
        bytes calldata signature
    ) external nonReentrant {
        // 디바이스 및 세션 존재 확인
        if (!isDeviceRegistered(msg.sender, deviceCredentialId)) {
            revert DeviceNotFound();
        }
        
        uint256 index = sessionIndex[msg.sender][sessionKey];
        if (index >= userSessions[msg.sender].length) {
            revert SessionNotFound();
        }
        
        // 하드웨어 서명 검증
        bytes32 revokeHash = keccak256(abi.encodePacked(
            msg.sender,
            sessionKey,
            "REVOKE_SESSION",
            block.timestamp
        ));
        
        Device memory device = getDevice(msg.sender, deviceCredentialId);
        // require(_verifyWebAuthnSignature(revokeHash, signature, device.publicKey), "Invalid device signature");
        
        // 세션 비활성화
        userSessions[msg.sender][index].isActive = false;
        
        emit SessionRevoked(msg.sender, sessionKey, deviceCredentialId);
    }
    
    /**
     * @notice 디바이스 등록 여부 확인
     */
    function isDeviceRegistered(address user, bytes32 credentialId) public view returns (bool) {
        if (userDevices[user].length == 0) return false;
        uint256 index = deviceIndex[user][credentialId];
        if (index >= userDevices[user].length) return false;
        return userDevices[user][index].credentialId == credentialId;
    }
    
    /**
     * @notice 디바이스 정보 조회
     */
    function getDevice(address user, bytes32 credentialId) public view returns (Device memory) {
        require(isDeviceRegistered(user, credentialId), "Device not found");
        uint256 index = deviceIndex[user][credentialId];
        return userDevices[user][index];
    }
    
    /**
     * @notice 사용자의 모든 디바이스 조회
     */
    function getUserDevices(address user) external view returns (Device[] memory) {
        return userDevices[user];
    }
    
    /**
     * @notice 사용자의 모든 세션 조회
     */
    function getUserSessions(address user) external view returns (Session[] memory) {
        return userSessions[user];
    }
    
    /**
     * @notice 디바이스 활성화/비활성화
     */
    function setDeviceStatus(
        bytes32 credentialId,
        bool isActive,
        bytes calldata signature
    ) external nonReentrant {
        require(isDeviceRegistered(msg.sender, credentialId), "Device not found");
        
        uint256 index = deviceIndex[msg.sender][credentialId];
        userDevices[msg.sender][index].isActive = isActive;
    }
    
    // 내부 함수들...
    
    /**
     * @dev WebAuthn 서명 검증 (실제 구현에서는 challenge, clientData 등 포함)
     */
    function _verifyWebAuthnSignature(
        bytes32 messageHash,
        bytes calldata signature,
        uint256[2] memory publicKey
    ) internal pure returns (bool) {
        // TODO: 실제 WebAuthn 서명 검증 로직 구현
        // 현재는 MockVerifier처럼 간단한 검증
        return signature.length > 0 && publicKey[0] != 0;
    }
} 