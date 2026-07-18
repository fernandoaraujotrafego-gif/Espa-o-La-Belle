# Espaço La Belle — Agenda e Gestão

Aplicativo interno para agenda, clientes, caixa, estoque, profissionais, serviços, relatórios e configurações do Espaço La Belle.

## Desenvolvimento local

Requisitos: Node.js 20 ou superior.

```bash
npm ci
npm run dev
```

Validações antes de publicar:

```bash
npm run lint
npm run build
npm audit --audit-level=high
```

## Segurança e acesso

- O login aceita somente contas já existentes no Firebase Authentication.
- Toda conta também precisa de um perfil criado por um administrador na coleção `users`.
- Novos usuários exigem senha forte e profissionais devem estar vinculados ao respectivo cadastro profissional.
- As permissões do banco estão definidas em `firestore.rules` e vinculadas ao banco nomeado em `firebase.json`.

## Publicação

Aplicativo no Google AI Studio: https://ai.studio/apps/3c23ae7c-bd7e-4820-bb41-b9270c1eecb0

As regras do banco nomeado devem ser validadas e publicadas separadamente pelo Firebase CLI:

```bash
firebase deploy --only firestore:ai-studio-espaolabelleagen-3c23ae7c-bd7e-4820-bb41-b9270c1eecb0 --project gen-lang-client-0067109529
```
