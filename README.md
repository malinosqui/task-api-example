# Task API

Uma API RESTful minimalista para gerenciamento de tarefas construída com Node.js, Express e TypeScript.

## 🚀 Características

- **TypeScript First**: Tipagem estrita e código type-safe
- **Arquitetura Limpa**: Separação clara entre camadas (routes, services, data)
- **In-Memory Storage**: Implementação inicial com interface para futura migração para BD
- **Logging Central**: Sistema de logs estruturado com Pino
- **Testes Abrangentes**: Cobertura de testes ≥ 80% com Jest
- **Container Ready**: Dockerfile otimizado para produção
- **Validação Robusta**: Validações de entrada e tratamento de erros
- **Soft Delete**: Deleção suave com flag `deletedAt`

## 📋 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/tasks` | Criar nova tarefa |
| `GET` | `/tasks` | Listar todas as tarefas (com filtros opcionais) |
| `GET` | `/tasks/:id` | Obter tarefa específica |
| `PUT` | `/tasks/:id` | Atualização completa (idempotente) |
| `PATCH` | `/tasks/:id` | Atualização parcial (título/status) |
| `DELETE` | `/tasks/:id` | Deleção suave |
| `GET` | `/health` | Status de saúde da aplicação |

## 🗂 Modelo de Dados

```typescript
interface Task {
  id: string;          // UUID v4
  title: string;       // Obrigatório, max 200 chars
  description?: string; // Opcional, max 1000 chars
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;    // ISO 8601 opcional
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
  deletedAt?: string;  // ISO timestamp (soft delete)
}
```

## 🔧 Instalação e Execução

### Pré-requisitos

- Node.js ≥ 20.0.0
- npm ou yarn

### Desenvolvimento Local

```bash
# Clone o repositório
git clone <repo-url>
cd task-api

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# A API estará disponível em http://localhost:3000
```

### Produção

```bash
# Build do projeto
npm run build

# Execute em produção
npm start
```

### Docker

```bash
# Build da imagem
docker build -t task-api .

# Execute o container
docker run -p 3000:3000 task-api

# Verifique o health check
curl http://localhost:3000/health
```

## 🧪 Testes

```bash
# Execute todos os testes
npm test

# Execute com cobertura
npm run test:coverage

# Execute em modo watch
npm run test:watch
```

## 📚 Exemplos de Uso

### Verificar Status da API

```bash
curl -X GET http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Criar Nova Tarefa

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementar autenticação",
    "description": "Adicionar JWT auth para proteger endpoints",
    "status": "todo",
    "dueDate": "2024-12-31T23:59:59.999Z"
  }'
```

**Resposta (201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Implementar autenticação",
  "description": "Adicionar JWT auth para proteger endpoints",
  "status": "todo",
  "dueDate": "2024-12-31T23:59:59.999Z",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Listar Todas as Tarefas

```bash
curl -X GET http://localhost:3000/tasks
```

### Filtrar Tarefas por Status

```bash
curl -X GET "http://localhost:3000/tasks?status=todo"
```

### Filtrar Tarefas por Data de Vencimento

```bash
curl -X GET "http://localhost:3000/tasks?dueDate=2024-12-31T23:59:59.999Z"
```

### Obter Tarefa Específica

```bash
curl -X GET http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000
```

### Atualização Completa

```bash
curl -X PUT http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implementar autenticação JWT",
    "description": "Finalizar implementação de JWT auth",
    "status": "in-progress",
    "dueDate": "2024-12-25T23:59:59.999Z"
  }'
```

### Atualização Parcial

```bash
# Atualizar apenas o status
curl -X PATCH http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'

# Atualizar apenas o título
curl -X PATCH http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"title": "Autenticação JWT Completa"}'
```

### Deletar Tarefa (Soft Delete)

```bash
curl -X DELETE http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000
```

**Resposta:** `204 No Content`

## ⚠️ Tratamento de Erros

### 400 - Bad Request
```json
{
  "error": "Título é obrigatório"
}
```

### 404 - Not Found
```json
{
  "error": "Tarefa não encontrada"
}
```

### 409 - Conflict
```json
{
  "error": "Uma tarefa com este título já existe"
}
```

### 500 - Internal Server Error
```json
{
  "error": "Erro interno do servidor"
}
```

## 🔍 Validações

- **Título**: Obrigatório, não pode estar vazio, máximo 200 caracteres
- **Descrição**: Opcional, máximo 1000 caracteres
- **Status**: Deve ser um de: `todo`, `in-progress`, `done`
- **Data de Vencimento**: Deve estar no formato ISO 8601 válido
- **Títulos Únicos**: Não são permitidas tarefas ativas com o mesmo título

## 🛠 Desenvolvimento

### Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento com reload automático
- `npm run build` - Compila TypeScript para JavaScript
- `npm run start` - Executa a versão de produção
- `npm run test` - Executa todos os testes
- `npm run test:coverage` - Executa testes com relatório de cobertura
- `npm run lint` - Executa ESLint
- `npm run lint:fix` - Executa ESLint com correção automática
- `npm run type-check` - Verifica tipos TypeScript

### Regras de Código

- ✅ **async/await** obrigatório (sem `.then()`)
- ✅ **Named exports** apenas (sem default exports)
- ✅ **Logger central** obrigatório (sem `console.*`)
- ✅ **Testes Jest** para rotas ≥ 20 LOC
- ✅ **Snapshots proibidos** (apenas asserções explícitas)
- ✅ **TypeScript strict mode**

### Arquitetura

```
src/
├── app.ts              # Aplicação Express principal
├── types/
│   └── task.ts         # Interfaces TypeScript
├── routes/
│   └── tasks.ts        # Rotas da API
├── services/
│   └── taskService.ts  # Lógica de negócio
├── data/
│   ├── dataStore.ts    # Interface de persistência
│   └── memoryStore.ts  # Implementação in-memory
├── lib/
│   └── logger.ts       # Logger central
└── __tests__/
    └── tasks.test.ts   # Testes de integração
```

## 🚢 Deploy

### Variáveis de Ambiente

- `PORT` - Porta do servidor (padrão: 3000)
- `NODE_ENV` - Ambiente de execução (development/production)
- `LOG_LEVEL` - Nível de log (debug/info/warn/error)

### Docker Compose (exemplo)

```yaml
version: '3.8'
services:
  task-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    restart: unless-stopped
```

## 📄 Licença

MIT

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

Certifique-se de que:
- [ ] Todos os testes passam (`npm test`)
- [ ] Cobertura ≥ 80%
- [ ] ESLint não reporta erros (`npm run lint`)
- [ ] CHANGELOG.md foi atualizado 