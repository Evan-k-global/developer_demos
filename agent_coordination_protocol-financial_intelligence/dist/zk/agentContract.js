var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import 'reflect-metadata';
import { Field, MerkleTree, Permissions, PublicKey, Signature, SmartContract, State, method, state, UInt64 } from 'o1js';
export class AgentRequestContract extends SmartContract {
    constructor() {
        super(...arguments);
        this.merkleRoot = State();
        this.outputMerkleRoot = State();
        this.agentMerkleRoot = State();
        this.creditsMerkleRoot = State();
        this.nullifierMerkleRoot = State();
    }
    static { this.TREE_HEIGHT = 20; }
    init() {
        super.init();
        const emptyRoot = new MerkleTree(AgentRequestContract.TREE_HEIGHT).getRoot();
        this.merkleRoot.set(emptyRoot);
        this.outputMerkleRoot.set(emptyRoot);
        this.agentMerkleRoot.set(emptyRoot);
        this.creditsMerkleRoot.set(emptyRoot);
        this.nullifierMerkleRoot.set(emptyRoot);
        this.account.permissions.set({
            ...Permissions.default(),
            editState: Permissions.proofOrSignature()
        });
    }
    async submitSignedRequest(requestHash, agentIdHash, oraclePk, signature, newRoot) {
        signature.verify(oraclePk, [requestHash, agentIdHash, newRoot]).assertTrue();
        this.merkleRoot.set(newRoot);
    }
    async submitSignedOutput(requestHash, outputHash, oraclePk, signature, newRoot) {
        signature.verify(oraclePk, [requestHash, outputHash, newRoot]).assertTrue();
        this.outputMerkleRoot.set(newRoot);
    }
    async registerAgent(agentIdHash, ownerHash, treasuryHash, stakeAmount, oraclePk, signature, newRoot) {
        signature.verify(oraclePk, [agentIdHash, ownerHash, treasuryHash, stakeAmount, newRoot]).assertTrue();
        this.agentMerkleRoot.set(newRoot);
    }
    async submitSignedCreditsUpdate(creditsRoot, nullifierRoot, oraclePk, signature) {
        signature.verify(oraclePk, [creditsRoot, nullifierRoot, Field(0), Field(0)]).assertTrue();
        this.creditsMerkleRoot.set(creditsRoot);
        this.nullifierMerkleRoot.set(nullifierRoot);
    }
    async submitSignedCreditsSpend(creditsRoot, nullifierRoot, oraclePk, signature, payee, amount, platformPayee, platformAmount) {
        signature.verify(oraclePk, [creditsRoot, nullifierRoot, amount.value, platformAmount.value]).assertTrue();
        this.creditsMerkleRoot.set(creditsRoot);
        this.nullifierMerkleRoot.set(nullifierRoot);
        this.send({ to: payee, amount });
        this.send({ to: platformPayee, amount: platformAmount });
    }
}
__decorate([
    state(Field),
    __metadata("design:type", Object)
], AgentRequestContract.prototype, "merkleRoot", void 0);
__decorate([
    state(Field),
    __metadata("design:type", Object)
], AgentRequestContract.prototype, "outputMerkleRoot", void 0);
__decorate([
    state(Field),
    __metadata("design:type", Object)
], AgentRequestContract.prototype, "agentMerkleRoot", void 0);
__decorate([
    state(Field),
    __metadata("design:type", Object)
], AgentRequestContract.prototype, "creditsMerkleRoot", void 0);
__decorate([
    state(Field),
    __metadata("design:type", Object)
], AgentRequestContract.prototype, "nullifierMerkleRoot", void 0);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field,
        Field,
        PublicKey,
        Signature,
        Field]),
    __metadata("design:returntype", Promise)
], AgentRequestContract.prototype, "submitSignedRequest", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field,
        Field,
        PublicKey,
        Signature,
        Field]),
    __metadata("design:returntype", Promise)
], AgentRequestContract.prototype, "submitSignedOutput", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field,
        Field,
        Field,
        Field,
        PublicKey,
        Signature,
        Field]),
    __metadata("design:returntype", Promise)
], AgentRequestContract.prototype, "registerAgent", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field,
        Field,
        PublicKey,
        Signature]),
    __metadata("design:returntype", Promise)
], AgentRequestContract.prototype, "submitSignedCreditsUpdate", null);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field,
        Field,
        PublicKey,
        Signature,
        PublicKey,
        UInt64,
        PublicKey,
        UInt64]),
    __metadata("design:returntype", Promise)
], AgentRequestContract.prototype, "submitSignedCreditsSpend", null);
