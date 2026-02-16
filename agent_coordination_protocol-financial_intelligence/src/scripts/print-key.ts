import 'dotenv/config';
import { PrivateKey } from 'o1js';

const priv = process.env.ZKAPP_PRIVATE_KEY;
if (!priv) {
  console.error('ZKAPP_PRIVATE_KEY env var not set');
  process.exit(1);
}

try {
  const pub = PrivateKey.fromBase58(priv).toPublicKey().toBase58();
  console.log('Derived ZKAPP_PUBLIC_KEY:', pub);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Failed to derive public key:', message);
  process.exit(1);
}
