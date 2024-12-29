export const FIELDS_TO_ENCRYPT: RegExp[] = [
	/.*pass.*/i,
	/.*token.*/i,
	/.*secret.*/i,
] as const
