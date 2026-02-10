import 'reflect-metadata';
import { Bool, Field, PublicKey, Signature, Struct, ZkProgram } from 'o1js';
export class VerdictInput extends Struct({
    imageHash: Field,
    verdict: Bool
}) {
}
export const AiVerdictProgram = ZkProgram({
    name: 'AiVerdictProgram',
    publicInput: VerdictInput,
    methods: {
        verifyOracle: {
            privateInputs: [PublicKey, Signature],
            async method(publicInput, oraclePk, signature) {
                signature
                    .verify(oraclePk, [publicInput.imageHash, publicInput.verdict.toField()])
                    .assertTrue();
            }
        }
    }
});
export class AiVerdictProof extends ZkProgram.Proof(AiVerdictProgram) {
}
