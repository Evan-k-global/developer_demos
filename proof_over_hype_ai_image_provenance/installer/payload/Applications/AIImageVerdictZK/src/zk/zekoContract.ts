import 'reflect-metadata';
import { Bool, Field, Permissions, PublicKey, Signature, SmartContract, State, method, state } from 'o1js';

export class AiVerdictContract extends SmartContract {
  @state(Field) lastImageHash = State<Field>();
  @state(Bool) lastVerdict = State<Bool>();
  @state(PublicKey) oraclePublicKey = State<PublicKey>();

  init() {
    super.init();
    this.lastImageHash.set(Field(0));
    this.lastVerdict.set(Bool(false));
    this.oraclePublicKey.set(PublicKey.empty());
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature()
    });
  }

  @method async submitSignedVerdict(
    imageHash: Field,
    verdict: Bool,
    oraclePk: PublicKey,
    signature: Signature
  ) {
    this.requireSignature();
    signature.verify(oraclePk, [imageHash, verdict.toField()]).assertTrue();
    this.oraclePublicKey.set(oraclePk);
    this.lastImageHash.set(imageHash);
    this.lastVerdict.set(verdict);
  }
}
