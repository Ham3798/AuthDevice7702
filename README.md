# AuthDevice7702

Hardware-locked session keys for EIP-7702 smart-EOAs.
One touch → short-lived key → ultra-cheap tx.

## 🔑 Concept
Register device – WebAuthn pubkey + ZK proof → on-chain DeviceManager.

Start session – wallet signs the new sessionPubKey; ZK proof (device touch) stores it with TTL.

Every tx – user touches again; browser unwraps the AES-encrypted sessionPriv (never stored raw) and signs.

On-chain – SessionDelegate just runs ecrecover (≈ 3 k gas) and amount/permission checks.

No session key bytes ever leave the browser, yet you avoid per-tx ZK gas.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Device
    participant Browser
    participant NoirProver
    participant EOA
    participant DeviceMgr as DeviceManager+SessionDelegate

    User->>Device: Touch ID (first use)
    Device->>Browser: P-256 pub + sig
    Browser->>NoirProver: prove_register()
    NoirProver-->>Browser: π₀
    Browser->>EOA: registerDevice(π₀, walletSig, devicePub)
    EOA->>DeviceMgr: registerDevice()
    DeviceMgr-->>EOA: device stored

    User->>Device: Touch ID (start session)
    Device->>Browser: P-256 sig r,s
    Browser->>NoirProver: prove_touch()
    NoirProver-->>Browser: π₁
    Browser->>EOA: startSession(π₁, walletSig, sessionPub, TTL)
    EOA->>DeviceMgr: startSession()
    DeviceMgr-->>EOA: session active

    note over User,DeviceMgr: each transaction
    User->>Device: Touch ID
    Device->>Browser: P-256 sig
    note over Browser: unwrap sessionPriv → sign txHash
    Browser->>EOA: execute(data, ecdsaSig)
    EOA->>DeviceMgr: execute(...)
    DeviceMgr-->>EOA: delegatecall forwarded
```


