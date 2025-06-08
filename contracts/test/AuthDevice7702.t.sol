// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console2} from "forge-std/Test.sol";
import {DeviceManagerSimple} from "../src/DeviceManagerSimple.sol";
import {SessionDelegate} from "../src/SessionDelegate.sol";
import {MockVerifier} from "../src/MockVerifier.sol";

/**
 * @title AuthDevice7702 Integration Test
 * @notice Option 4 AuthDevice7702 모델 통합 테스트
 * @dev EIP-7702 + 멀티 디바이스 관리 + WebAuthn + ZK Proof 테스트
 */
contract AuthDevice7702Test is Test {
    
    DeviceManagerSimple public deviceManager;
    SessionDelegate public sessionDelegate;
    MockVerifier public mockVerifier;
    
    // 테스트 계정들
    uint256 public constant ALICE_PRIVATE_KEY = 0xa11ce;
    address public alice = vm.addr(ALICE_PRIVATE_KEY);  // EOA 사용자  
    address public bob = makeAddr("bob");      // 다른 사용자
    
    // 테스트용 WebAuthn 키 쌍
    bytes32 public constant DEVICE_ID_1 = bytes32("device_macbook_touchid");
    uint256[2] public devicePubKey1 = [
        0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,
        0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321
    ];
    
    bytes32 public constant DEVICE_ID_2 = bytes32("device_iphone_faceid");
    uint256[2] public devicePubKey2 = [
        0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890,
        0x0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba
    ];
    
    // 테스트용 세션 키
    address public sessionKey1 = makeAddr("sessionKey1");
    address public sessionKey2 = makeAddr("sessionKey2");
    
    function setUp() public {
        // 1. MockVerifier 배포
        mockVerifier = new MockVerifier();
        
        // 2. SessionDelegate 배포 
        sessionDelegate = new SessionDelegate(address(mockVerifier));
        
        // 3. DeviceManager 배포
        deviceManager = new DeviceManagerSimple();
        
        console2.log(unicode"🚀 AuthDevice7702 테스트 환경 설정 완료");
        console2.log("DeviceManager:", address(deviceManager));
        console2.log("SessionDelegate:", address(sessionDelegate));
        console2.log("MockVerifier:", address(mockVerifier));
    }
    
    function test_DeviceRegistration() public {
        console2.log(unicode"\n🔐 디바이스 등록 테스트");
        
        vm.startPrank(alice);
        
        // 첫 번째 디바이스 등록
        deviceManager.registerDevice(
            DEVICE_ID_1,
            devicePubKey1,
            "MacBook Pro Touch ID"
        );
        
        // 등록 확인
        assertTrue(deviceManager.isDeviceRegistered(alice, DEVICE_ID_1));
        
        DeviceManagerSimple.Device memory device = deviceManager.getDevice(alice, DEVICE_ID_1);
        assertEq(device.credentialId, DEVICE_ID_1);
        assertEq(device.publicKey[0], devicePubKey1[0]);
        assertEq(device.publicKey[1], devicePubKey1[1]);
        assertEq(device.deviceName, "MacBook Pro Touch ID");
        assertTrue(device.isActive);
        
        vm.stopPrank();
        
        console2.log(unicode"✅ 디바이스 등록 성공");
    }
    
    function test_MultiDeviceRegistration() public {
        console2.log(unicode"\n📱 멀티 디바이스 등록 테스트");
        
        vm.startPrank(alice);
        
        // 첫 번째 디바이스 등록
        deviceManager.registerDevice(
            DEVICE_ID_1,
            devicePubKey1,
            "MacBook Pro Touch ID"
        );
        
        // 두 번째 디바이스 등록
        deviceManager.registerDevice(
            DEVICE_ID_2,
            devicePubKey2,
            "iPhone Face ID"
        );
        
        // 사용자의 모든 디바이스 조회
        DeviceManagerSimple.Device[] memory devices = deviceManager.getUserDevices(alice);
        assertEq(devices.length, 2);
        
        assertEq(devices[0].deviceName, "MacBook Pro Touch ID");
        assertEq(devices[1].deviceName, "iPhone Face ID");
        
        vm.stopPrank();
        
        console2.log(unicode"✅ 멀티 디바이스 등록 성공");
        console2.log(unicode"디바이스 개수:", devices.length);
    }
    
    function test_SessionCreation() public {
        console2.log(unicode"\n⏰ 세션 생성 테스트");
        
        vm.startPrank(alice);
        
        // 1. 디바이스 등록
        deviceManager.registerDevice(
            DEVICE_ID_1,
            devicePubKey1,
            "MacBook Pro Touch ID"
        );
        
        // 2. 세션 생성 (1시간 유효, 가스 한도 100000)
        uint256 duration = 3600; // 1시간
        uint256 gasLimit = 100000;
        
        deviceManager.createSession(
            sessionKey1,
            duration,
            gasLimit,
            DEVICE_ID_1
        );
        
        // 3. 세션 유효성 확인
        assertTrue(deviceManager.isValidSession(alice, sessionKey1));
        
        DeviceManagerSimple.Session[] memory sessions = deviceManager.getUserSessions(alice);
        assertEq(sessions.length, 1);
        assertEq(sessions[0].sessionKey, sessionKey1);
        assertEq(sessions[0].gasLimit, gasLimit);
        assertEq(sessions[0].authorizedBy, DEVICE_ID_1);
        assertTrue(sessions[0].isActive);
        
        vm.stopPrank();
        
        console2.log(unicode"✅ 세션 생성 성공");
        console2.log(unicode"세션 키:", sessionKey1);
    }
    
    function test_SessionExpiration() public {
        console2.log(unicode"\n⏳ 세션 만료 테스트");
        
        vm.startPrank(alice);
        
        // 1. 디바이스 등록
        deviceManager.registerDevice(
            DEVICE_ID_1,
            devicePubKey1,
            "MacBook Pro Touch ID"
        );
        
        // 2. 짧은 세션 생성 (1초)
        deviceManager.createSession(
            sessionKey1,
            1, // 1초
            100000,
            DEVICE_ID_1
        );
        
        // 3. 즉시 확인 - 유효해야 함
        assertTrue(deviceManager.isValidSession(alice, sessionKey1));
        
        // 4. 시간 경과 후 확인 - 만료되어야 함
        vm.warp(block.timestamp + 2); // 2초 경과
        assertFalse(deviceManager.isValidSession(alice, sessionKey1));
        
        vm.stopPrank();
        
        console2.log(unicode"✅ 세션 만료 동작 확인");
    }
    
    function test_SessionRevocation() public {
        console2.log(unicode"\n🚫 세션 취소 테스트");
        
        vm.startPrank(alice);
        
        // 1. 디바이스 등록 및 세션 생성
        deviceManager.registerDevice(
            DEVICE_ID_1,
            devicePubKey1,
            "MacBook Pro Touch ID"
        );
        
        deviceManager.createSession(
            sessionKey1,
            3600,
            100000,
            DEVICE_ID_1
        );
        
        // 2. 세션 활성 확인
        assertTrue(deviceManager.isValidSession(alice, sessionKey1));
        
        // 3. 세션 취소
        deviceManager.revokeSession(sessionKey1, DEVICE_ID_1);
        
        // 4. 세션 비활성 확인
        assertFalse(deviceManager.isValidSession(alice, sessionKey1));
        
        vm.stopPrank();
        
        console2.log(unicode"✅ 세션 취소 성공");
    }
    
    function test_EIP7702Integration() public {
        console2.log(unicode"\n🔧 EIP-7702 통합 테스트");
        
        // 1. 먼저 SessionDelegate에 디바이스 등록
        vm.startPrank(alice);
        
        // Mock ZK Proof 데이터
        bytes memory proof = abi.encode("mock_zk_proof");
        uint256[] memory publicInputs = new uint256[](3);
        publicInputs[0] = uint256(keccak256("challenge"));
        publicInputs[1] = devicePubKey1[0];
        publicInputs[2] = devicePubKey1[1];
        
        // 디바이스 등록
        sessionDelegate.registerDevice(
            proof,
            publicInputs,
            "MacBook Pro Touch ID"
        );
        
        // 2. SessionDelegate로 ZK 증명 기반 세션 시작
        // Mock 지갑 서명 - sessionHash 계산 방식 맞추기
        bytes32 deviceId = keccak256(abi.encodePacked(devicePubKey1[0], devicePubKey1[1]));
        bytes32 encryptedSessionKey = bytes32("mock_encrypted_session_key");
        
        bytes32 sessionHash = keccak256(abi.encodePacked(
            alice,
            uint256(uint160(sessionKey1)), // 세션 공개키 X
            uint256(0), // 세션 공개키 Y 
            uint256(3600), // TTL
            deviceId,
            encryptedSessionKey,
            block.timestamp
        ));
        
        // 실제 ECDSA 서명 생성 (Alice의 private key 사용)
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ALICE_PRIVATE_KEY, sessionHash);
        bytes memory walletSig = abi.encodePacked(r, s, v);
        
        sessionDelegate.startSession(
            proof,
            publicInputs,
            walletSig,
            uint256(uint160(sessionKey1)), // 세션 공개키 X (주소를 uint256으로)
            0, // 세션 공개키 Y 
            3600, // TTL: 1시간
            encryptedSessionKey
        );
        
        // 세션 정보 확인
        (bool isActive, uint256 expiresAt, uint256 timeRemaining, uint256 sessionPubKeyX, uint256 sessionPubKeyY, bytes32 returnedDeviceId, bytes32 encryptedKey) = 
            sessionDelegate.getSessionInfo(alice);
            
        assertTrue(isActive);
        assertGt(expiresAt, block.timestamp);
        assertGt(timeRemaining, 0);
        
        vm.stopPrank();
        
        console2.log(unicode"✅ EIP-7702 SessionDelegate 통합 성공");
        console2.log(unicode"세션 만료 시간:", expiresAt);
    }
    
    function testFail_UnauthorizedDeviceAccess() public {
        console2.log(unicode"\n🛡️ 권한 없는 디바이스 접근 테스트");
        
        vm.startPrank(alice);
        
        // Alice가 디바이스 등록
        deviceManager.registerDevice(
            DEVICE_ID_1,
            devicePubKey1,
            "Alice's MacBook"
        );
        
        vm.stopPrank();
        vm.startPrank(bob);
        
        // Bob이 Alice의 디바이스로 세션 생성 시도 (실패해야 함)
        deviceManager.createSession(
            sessionKey1,
            3600,
            100000,
            DEVICE_ID_1 // Alice의 디바이스
        );
        
        vm.stopPrank();
        
        console2.log(unicode"❌ 예상된 실패: 권한 없는 접근 차단됨");
    }
    
    function test_DeviceDeactivation() public {
        console2.log(unicode"\n🔐 디바이스 비활성화 테스트");
        
        vm.startPrank(alice);
        
        // 1. 디바이스 등록
        deviceManager.registerDevice(
            DEVICE_ID_1,
            devicePubKey1,
            "MacBook Pro Touch ID"
        );
        
        // 2. 디바이스 비활성화
        deviceManager.setDeviceStatus(DEVICE_ID_1, false);
        
        // 3. 비활성화된 디바이스로 세션 생성 시도 (실패해야 함)
        vm.expectRevert("Device is inactive");
        deviceManager.createSession(
            sessionKey1,
            3600,
            100000,
            DEVICE_ID_1
        );
        
        vm.stopPrank();
        
        console2.log(unicode"✅ 비활성화된 디바이스 접근 차단 확인");
    }
} 