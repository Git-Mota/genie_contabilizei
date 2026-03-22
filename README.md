# genie_contabilizei

## Configuração inicial

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