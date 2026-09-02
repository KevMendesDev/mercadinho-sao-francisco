# Notas de validação

Última validação técnica local:

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado.
- `npm test`: aprovado (11 testes).
- `npx tsc --project tsconfig.database.json --noEmit --incremental false`: aprovado.

Antes de subir uma alteração de schema, execute `npm run db:migrate` em ambiente equivalente ao de destino. Para reverter somente a última migration, use `npm run db:revert` após backup validado.
