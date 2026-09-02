-- 0007_add_accounts_issuer.sql
-- Better Auth v1.7+ requiere que las cuentas locales de proveedor 'credential'
-- lleven issuer = 'local:credential' (createLocalAccountIssuer). Sin esa columna,
-- el sign-in por email/password no encuentra la cuenta credential y responde
-- "User not found" aunque el usuario exista.
-- Se añade la columna nullable y se rellena SOLO las filas credential existentes.

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS issuer varchar(255);
UPDATE accounts SET issuer = 'local:credential' WHERE provider_id = 'credential' AND (issuer IS NULL OR issuer = '');