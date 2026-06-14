# genie_contabilizei

## Configuração inicial

Crie um arquivo .env na raiz do projeto com as seguintes variáveis: 
```powershell
DATABRICKS_HOST=https://sua-instancia.azuredatabricks.net 

DATABRICKS_TOKEN=dapi_seu_token_aqui 

GENIE_SPACE_ID=seu_space_id_aqui 

DATABRICKS_WAREHOUSE_ID=seu_warehouse_id_aqui

```
Para configurar o frontend com URL de API personalizada, crie front/.env: 
```powershell
VITE_API_URL=http://localhost:8000 
```

Abra um terminal no VS Code e certifique-se de estar na pasta `genie_contabilizei`.

Execute os comandos abaixo em sequência:
```powershell
winget install Python.Python.3.12
py -3.12 -m venv venv
venv\Scripts\Activate
```

Feche o terminal após a ativação.

---

## Terminal 1 — Backend

Abra um novo terminal e execute:
```powershell
cd backend
pip install -r requirements.txt
cd ..
python -m uvicorn backend.main:app --reload
```

Mantenha este terminal aberto.

---

## Terminal 2 — Frontend

Abra um novo terminal e instale o Node.js:
```powershell
winget install OpenJS.NodeJS.LTS
```

Feche e abra um novo terminal, depois execute:
```powershell
$env:PATH += ";C:\Program Files\nodejs"
cd front
npm install
npm run dev
```
