// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockVerifier
 * @notice Phase 1 데모용 Mock ZK Verifier - 실제 환경에서는 실제 verifier 사용
 * @dev 모든 증명을 유효한 것으로 처리 (데모 목적)
 */
contract MockVerifier {
    
    bool private mockResult = true;
    
    function setMockResult(bool result) external {
        mockResult = result;
    }
    
    // 데모용: mockResult 반환
    function verify(
        bytes memory proof,
        uint256[] memory publicInputs
    ) external view returns (bool) {
        // 최소한의 입력 유효성 검사
        require(proof.length > 0, "Empty proof");
        require(publicInputs.length >= 3, "Invalid public inputs length");
        
        // Phase 1 데모: mockResult 반환
        return mockResult;
    }
    
    // 실제 환경에서는 이 함수들을 구현해야 함
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external pure returns (bool) {
        // Mock: 항상 성공
        return true;
    }
} 