import { AccountUpdate, PublicKey, TokenId, UInt64 } from 'o1js';

export class SimpleFungibleToken {
  readonly tokenAddress: PublicKey;
  readonly tokenId: ReturnType<typeof TokenId.derive>;

  constructor(tokenAddress: PublicKey) {
    this.tokenAddress = tokenAddress;
    this.tokenId = TokenId.derive(tokenAddress);
  }

  // Minimal transfer helper for standard token contracts.
  // Note: some token contracts require explicit approval/calls.
  transfer(from: PublicKey, to: PublicKey, amount: UInt64) {
    const senderUpdate = AccountUpdate.createSigned(from, this.tokenId);
    senderUpdate.send({ to, amount });
  }
}
