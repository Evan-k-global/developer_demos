import { AccountUpdate, TokenId } from 'o1js';
export class SimpleFungibleToken {
    constructor(tokenAddress) {
        this.tokenAddress = tokenAddress;
        this.tokenId = TokenId.derive(tokenAddress);
    }
    // Minimal transfer helper for standard token contracts.
    // Note: some token contracts require explicit approval/calls.
    transfer(from, to, amount) {
        const senderUpdate = AccountUpdate.createSigned(from, this.tokenId);
        senderUpdate.send({ to, amount });
    }
}
