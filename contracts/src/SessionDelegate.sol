// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVerifier {
    function verify(bytes memory proof, uint256[] memory publicInputs) external returns (bool);
}

/**
 * @title SessionDelegate
 * @notice EIP-7702 호환 세션 기반 스마트 지갑 델리게이트 (Phase 1: Hardware Device Support)
 * @dev WebAuthn + ZK 증명을 통한 시간 제한 세션 권한 관리 + 하드웨어 기기 등록/검증
 */
contract SessionDelegate {
    struct Device {
        uint256 pubKeyX;         // 기기 공개키 X 좌표
        uint256 pubKeyY;         // 기기 공개키 Y 좌표
        bool isRegistered;       // 기기 등록 상태
        uint256 registeredAt;    // 등록 시간
        string deviceName;       // 기기 이름 (선택사항)
    }
    
    struct Session {
        address owner;           // 세션 소유자 (EOA)
        uint256 sessionPubKeyX;  // 세션 공개키 X 좌표
        uint256 sessionPubKeyY;  // 세션 공개키 Y 좌표  
        uint256 expires;         // 세션 만료 시간
        bool isActive;           // 세션 활성 상태
        bytes32 deviceId;        // 연결된 기기 ID
        bytes32 encryptedSessionKey; // AES 암호화된 세션 개인키 (하드웨어로 복호화)
    }
    
    // 상태 변수
    mapping(address => Session) public sessions;
    mapping(address => mapping(bytes32 => Device)) public devices; // owner => deviceId => Device
    mapping(address => bytes32[]) public ownerDevices; // owner가 가진 기기 ID 목록
    IVerifier public immutable verifier;
    
    // 이벤트
    event DeviceRegistered(
        address indexed owner,
        bytes32 indexed deviceId,
        uint256 pubKeyX,
        uint256 pubKeyY,
        string deviceName
    );
    
    event SessionStarted(
        address indexed owner,
        uint256 sessionPubKeyX,
        uint256 sessionPubKeyY,
        uint256 expires,
        bytes32 deviceId
    );
    
    event SessionRevoked(address indexed owner);
    event SessionExecuted(address indexed owner, bytes data, bytes32 deviceId);
    
    // 에러
    error InvalidZKProof();
    error InvalidWalletSignature();
    error SessionExpired();
    error SessionNotFound();
    error InvalidSessionSignature();
    error ExecutionFailed();
    error Unauthorized();
    error DeviceNotRegistered();
    error DeviceAlreadyRegistered();
    error InvalidDeviceSignature();
    
    constructor(address _verifier) {
        verifier = IVerifier(_verifier);
    }
    
    /**
     * @notice 하드웨어 기기 등록 (ZK 증명 필요)
     * @param proof ZK 증명 (WebAuthn 서명 검증)
     * @param publicInputs ZK 증명의 공개 입력값 [challengeHash, pubKeyX, pubKeyY]
     * @param deviceName 기기 이름
     */
    function registerDevice(
        bytes memory proof,
        uint256[] memory publicInputs, // [challengeHash, pubKeyX, pubKeyY]
        string memory deviceName
    ) external {
        // 1. ZK 증명 검증 (WebAuthn 서명이 유효함을 확인)
        if (!verifier.verify(proof, publicInputs)) {
            revert InvalidZKProof();
        }
        
        require(publicInputs.length >= 3, "Invalid public inputs");
        uint256 pubKeyX = publicInputs[1];
        uint256 pubKeyY = publicInputs[2];
        
        // 2. 기기 ID 생성 (공개키 해시 기반)
        bytes32 deviceId = keccak256(abi.encodePacked(pubKeyX, pubKeyY));
        
        // 3. 이미 등록된 기기인지 확인
        if (devices[msg.sender][deviceId].isRegistered) {
            revert DeviceAlreadyRegistered();
        }
        
        // 4. 기기 등록
        devices[msg.sender][deviceId] = Device({
            pubKeyX: pubKeyX,
            pubKeyY: pubKeyY,
            isRegistered: true,
            registeredAt: block.timestamp,
            deviceName: deviceName
        });
        
        // 5. 소유자 기기 목록에 추가
        ownerDevices[msg.sender].push(deviceId);
        
        emit DeviceRegistered(msg.sender, deviceId, pubKeyX, pubKeyY, deviceName);
    }
    
    /**
     * @notice ZK 증명과 지갑 서명을 통한 세션 시작 (Phase 1: Device 연결)
     * @param proof ZK 증명 (WebAuthn 서명 검증)
     * @param publicInputs ZK 증명의 공개 입력값 [challengeHash, pubKeyX, pubKeyY]
     * @param walletSig 지갑 서명 (세션 생성 승인)
     * @param sessionPubKeyX 세션 공개키 X 좌표
     * @param sessionPubKeyY 세션 공개키 Y 좌표
     * @param ttl 세션 유효 기간 (초)
     * @param encryptedSessionKey AES 암호화된 세션 개인키 (하드웨어로 복호화 필요)
     */
    function startSession(
        bytes memory proof,
        uint256[] memory publicInputs, // [challengeHash, pubKeyX, pubKeyY]
        bytes memory walletSig,
        uint256 sessionPubKeyX,
        uint256 sessionPubKeyY,
        uint256 ttl,
        bytes32 encryptedSessionKey
    ) external {
        // 1. ZK 증명 검증 (WebAuthn 서명이 유효함을 확인)
        if (!verifier.verify(proof, publicInputs)) {
            revert InvalidZKProof();
        }
        
        require(publicInputs.length >= 3, "Invalid public inputs");
        uint256 devicePubKeyX = publicInputs[1];
        uint256 devicePubKeyY = publicInputs[2];
        
        // 2. 기기 ID 확인 및 등록 여부 검증
        bytes32 deviceId = keccak256(abi.encodePacked(devicePubKeyX, devicePubKeyY));
        if (!devices[msg.sender][deviceId].isRegistered) {
            revert DeviceNotRegistered();
        }
        
        // 3. 지갑 서명 검증 (세션 생성 승인)
        bytes32 sessionHash = keccak256(abi.encodePacked(
            msg.sender,           // EOA 주소
            sessionPubKeyX,       // 세션 공개키
            sessionPubKeyY,
            ttl,                  // 세션 유효 기간
            deviceId,             // 기기 ID
            encryptedSessionKey,  // 암호화된 세션키
            block.timestamp       // 현재 시간 (replay 방지)
        ));
        
        address signer = recoverSigner(sessionHash, walletSig);
        if (signer != msg.sender) {
            revert InvalidWalletSignature();
        }
        
        // 4. 세션 등록
        uint256 expiryTime = block.timestamp + ttl;
        sessions[msg.sender] = Session({
            owner: msg.sender,
            sessionPubKeyX: sessionPubKeyX,
            sessionPubKeyY: sessionPubKeyY,
            expires: expiryTime,
            isActive: true,
            deviceId: deviceId,
            encryptedSessionKey: encryptedSessionKey
        });
        
        emit SessionStarted(msg.sender, sessionPubKeyX, sessionPubKeyY, expiryTime, deviceId);
    }
    
    /**
     * @notice Phase 1: 하드웨어 터치 + 세션 키를 통한 트랜잭션 실행
     * @param data 실행할 트랜잭션 데이터
     * @param r 세션 서명 r 값
     * @param s 세션 서명 s 값
     * @param v 세션 서명 v 값
     * @param hardwareProof 하드웨어 터치 ZK 증명 (매 트랜잭션마다)
     * @param hardwarePublicInputs 하드웨어 ZK 증명의 공개 입력값
     */
    function execute(
        bytes memory data,
        uint256 r,
        uint256 s,
        uint8 v,
        bytes memory hardwareProof,
        uint256[] memory hardwarePublicInputs
    ) external {
        Session memory session = sessions[msg.sender];
        
        // 1. 세션 유효성 검사
        if (!session.isActive) {
            revert SessionNotFound();
        }
        
        if (block.timestamp >= session.expires) {
            revert SessionExpired();
        }
        
        // 2. 하드웨어 터치 검증 (매 트랜잭션마다)
        if (!verifier.verify(hardwareProof, hardwarePublicInputs)) {
            revert InvalidZKProof();
        }
        
        // 3. 기기 검증 (하드웨어 증명이 등록된 기기에서 온 것인지 확인)
        require(hardwarePublicInputs.length >= 3, "Invalid hardware public inputs");
        uint256 hardwarePubKeyX = hardwarePublicInputs[1];
        uint256 hardwarePubKeyY = hardwarePublicInputs[2];
        bytes32 hardwareDeviceId = keccak256(abi.encodePacked(hardwarePubKeyX, hardwarePubKeyY));
        
        if (hardwareDeviceId != session.deviceId) {
            revert InvalidDeviceSignature();
        }
        
        // 4. 세션 키로 서명 검증
        bytes32 dataHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(data, block.timestamp)) // timestamp 추가로 replay 방지
        ));
        
        // ECDSA 복구를 통한 서명 검증
        address recovered = ecrecover(dataHash, v, bytes32(r), bytes32(s));
        address expectedSessionAddress = getSessionAddress(session.sessionPubKeyX, session.sessionPubKeyY);
        
        if (recovered != expectedSessionAddress) {
            revert InvalidSessionSignature();
        }
        
        // 5. 트랜잭션 실행
        (bool success, ) = msg.sender.call(data);
        if (!success) {
            revert ExecutionFailed();
        }
        
        emit SessionExecuted(msg.sender, data, session.deviceId);
    }
    
    /**
     * @notice 등록된 기기 정보 조회
     */
    function getDeviceInfo(address owner, bytes32 deviceId) external view returns (
        uint256 pubKeyX,
        uint256 pubKeyY,
        bool isRegistered,
        uint256 registeredAt,
        string memory deviceName
    ) {
        Device memory device = devices[owner][deviceId];
        return (
            device.pubKeyX,
            device.pubKeyY,
            device.isRegistered,
            device.registeredAt,
            device.deviceName
        );
    }
    
    /**
     * @notice 소유자의 모든 기기 ID 목록 조회
     */
    function getOwnerDevices(address owner) external view returns (bytes32[] memory) {
        return ownerDevices[owner];
    }
    
    /**
     * @notice 세션 즉시 해제
     */
    function revokeSession() external {
        if (!sessions[msg.sender].isActive) {
            revert SessionNotFound();
        }
        
        sessions[msg.sender].isActive = false;
        emit SessionRevoked(msg.sender);
    }
    
    /**
     * @notice 만료된 세션 정리 (가스 최적화)
     */
    function cleanupExpiredSession(address owner) external {
        Session storage session = sessions[owner];
        if (session.isActive && block.timestamp >= session.expires) {
            session.isActive = false;
            emit SessionRevoked(owner);
        }
    }
    
    /**
     * @notice 세션 상태 조회 (Phase 1: Device 정보 포함)
     */
    function getSessionInfo(address owner) external view returns (
        bool isActive,
        uint256 expiresAt,
        uint256 timeRemaining,
        uint256 sessionPubKeyX,
        uint256 sessionPubKeyY,
        bytes32 deviceId,
        bytes32 encryptedSessionKey
    ) {
        Session memory session = sessions[owner];
        isActive = session.isActive && block.timestamp < session.expires;
        expiresAt = session.expires;
        timeRemaining = session.expires > block.timestamp ? session.expires - block.timestamp : 0;
        sessionPubKeyX = session.sessionPubKeyX;
        sessionPubKeyY = session.sessionPubKeyY;
        deviceId = session.deviceId;
        encryptedSessionKey = session.encryptedSessionKey;
    }
    
    // === 헬퍼 함수들 ===
    
    /**
     * @notice ECDSA 서명에서 서명자 주소 복구
     */
    function recoverSigner(bytes32 hash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        if (v < 27) {
            v += 27;
        }
        
        return ecrecover(hash, v, r, s);
    }
    
    /**
     * @notice 공개키 좌표로부터 이더리움 주소 계산
     */
    function getSessionAddress(uint256 pubKeyX, uint256 pubKeyY) internal pure returns (address) {
        // 공개키 좌표를 압축되지 않은 형태로 변환 (04 + x + y)
        bytes memory pubKey = abi.encodePacked(uint8(0x04), pubKeyX, pubKeyY);
        
        // Keccak256 해시의 마지막 20바이트를 주소로 사용
        return address(uint160(uint256(keccak256(pubKey))));
    }
} 