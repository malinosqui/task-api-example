# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- API RESTful completa para gerenciamento de tarefas
- Endpoints CRUD para tarefas (POST, GET, PUT, PATCH, DELETE)
- Filtros opcionais por status e data de vencimento
- Validação de títulos únicos para tarefas ativas
- Soft delete com flag `deletedAt`
- Sistema de logging central com Pino
- Testes Jest abrangentes com cobertura ≥ 80%
- Dockerfile otimizado para produção
- Health check endpoint (`/health`)
- Middleware de tratamento de erros global
- Validações robustas de entrada de dados
- Suporte a async/await em todas operações (incluindo in-memory)
- Arquitetura em camadas (routes, services, data)
- Interface DataStore para fácil migração para banco de dados
- Configuração ESLint com regras específicas do projeto
- Configuração Jest com proibição de snapshots
- Documentação completa com exemplos cURL
- Suporte a TypeScript strict mode
- Named exports obrigatórios (sem default exports)

### Technical Details
- Node.js ≥ 20.0.0
- Express.js como framework web
- TypeScript para type safety
- UUID v4 para identificadores únicos
- Pino para logging estruturado
- Jest + Supertest para testes
- Multi-stage Docker build
- Health checks automatizados 