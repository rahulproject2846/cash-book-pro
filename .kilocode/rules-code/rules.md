CODE EXECUTION LAWS:
TYPE SAFETY: NEVER use any type. Fail the process rather than bypassing TypeScript checks. Always suggest running npx tsc --noEmit post-edit.
ID LOOKUP PROTOCOL: All Dexie queries MUST utilize the Triple-Link pattern (record.cid || record._id || record.localId) with rigorous Number() casting safeguards (!isNaN(Number(id))).
NON-DESTRUCTIVE UI: Array updates in Zustand must exclusively use .map() or .filter(). Full replacement (books: newBooks) is globally forbidden unless during absolute initialization.
THE PAYLOAD DIET: Adhere to strict 'Lean Signaling'. Network requests must NEVER send unnecessary large fields (name, description, images) if it is purely a transactional signal.
SURGICAL LOGGING: For all backend mutations or complex sync algorithms, embed robust try-catch structures with prefix-stamped console traces (e.g., console.error('🚨 [MODULE_NAME] ...')).