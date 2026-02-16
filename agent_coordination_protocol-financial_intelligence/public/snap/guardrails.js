const DEFAULT_SNAP_ID = 'npm:mina-portal';
const LOCAL_SNAP_ID = 'local:http://localhost:8080';
const ALLOWED_METHODS = new Set([
  'mina_accountList',
  'mina_createAccount',
  'mina_changeNetwork',
  'mina_sendTransaction'
]);

export function getSnapId() {
  return document.body?.dataset.snapId || DEFAULT_SNAP_ID;
}

export function setSnapMode(isLocal) {
  const snapId = isLocal ? LOCAL_SNAP_ID : DEFAULT_SNAP_ID;
  if (document.body) {
    document.body.dataset.snapId = snapId;
  }
  localStorage.setItem('snapMode', isLocal ? 'local' : 'prod');
}

export function getAllowedOrigins() {
  const raw = document.body?.dataset.allowedOrigins || '';
  const list = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length ? list : [window.location.origin];
}

export function getAllowedSnapIds() {
  const raw = document.body?.dataset.allowedSnapIds || '';
  const list = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length ? list : [DEFAULT_SNAP_ID, LOCAL_SNAP_ID];
}

export function assertAllowedOrigin() {
  const allowed = getAllowedOrigins();
  if (!allowed.includes(window.location.origin)) {
    throw new Error('Snap access blocked: origin not allowed.');
  }
}

export function assertAllowedSnapId(snapId) {
  const allowed = getAllowedSnapIds();
  if (!allowed.includes(snapId)) {
    throw new Error('Snap access blocked: snap id not allowed.');
  }
}

export function assertAllowedMethod(method) {
  if (!ALLOWED_METHODS.has(method)) {
    throw new Error('Snap access blocked: method not allowed.');
  }
}
