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
import { Bool, Field, MerkleTree, Permissions, PublicKey, Signature, SmartContract, State, method, state } from 'o1js';
export class AiVerdictContract extends SmartContract {
    constructor() {
        super(...arguments);
        this.lastImageHash = State();
        this.lastVerdict = State();
        this.oraclePublicKey = State();
        this.merkleRoot = State();
    }
    static { this.TREE_HEIGHT = 20; }
    init() {
        super.init();
        this.lastImageHash.set(Field(0));
        this.lastVerdict.set(Bool(false));
        this.oraclePublicKey.set(PublicKey.empty());
        const emptyRoot = new MerkleTree(AiVerdictContract.TREE_HEIGHT).getRoot();
        this.merkleRoot.set(emptyRoot);
        this.account.permissions.set({
            ...Permissions.default(),
            editState: Permissions.proofOrSignature()
        });
    }
    async submitSignedVerdict(imageHash, verdict, oraclePk, signature, newRoot) {
        this.requireSignature();
        signature
            .verify(oraclePk, [imageHash, verdict.toField(), newRoot])
            .assertTrue();
        this.oraclePublicKey.set(oraclePk);
        this.lastImageHash.set(imageHash);
        this.lastVerdict.set(verdict);
        this.merkleRoot.set(newRoot);
    }
}
__decorate([
    state(Field),
    __metadata("design:type", Object)
], AiVerdictContract.prototype, "lastImageHash", void 0);
__decorate([
    state(Bool),
    __metadata("design:type", Object)
], AiVerdictContract.prototype, "lastVerdict", void 0);
__decorate([
    state(PublicKey),
    __metadata("design:type", Object)
], AiVerdictContract.prototype, "oraclePublicKey", void 0);
__decorate([
    state(Field),
    __metadata("design:type", Object)
], AiVerdictContract.prototype, "merkleRoot", void 0);
__decorate([
    method,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Field,
        Bool,
        PublicKey,
        Signature,
        Field]),
    __metadata("design:returntype", Promise)
], AiVerdictContract.prototype, "submitSignedVerdict", null);
