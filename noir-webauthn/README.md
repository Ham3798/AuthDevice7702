This folder "noir-webauthn" is forked from [hyli-org/vibe-check](https://github.com/hyli-org/vibe-check/tree/main/noir-webauthn)

# Noir WebAuthn
--> [Noir installation](https://noir-lang.org/docs/getting_started/installation/)
### Build
```
nargo compile
```
You'll get a [json used in the frontend](../vibe-check-frontend/src/webauthn.json) for noir proving.

### Tooling

> We recommand you to use [bun](https://bun.sh/docs/installation)

If you come to change the noir file, you will need to recompute the verification key. You can do so with:
```
cd prover
bun run extractVerificationKey.ts
```
