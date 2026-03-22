# genie_contabilizei

abra um terminal no vscode
certifique que está na pasta genie_contabilizei
execute os comandos: 
python -m venv venv
venv\Scripts\Activate
pip install python-dotenv
pip install requests

feche o terminal

# Terminal 1 — backend
cd genie_contabilizei
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload

# Terminal 2 — frontend
winget install OpenJS.NodeJS.LTS
### fechar e abrir terminal
$env:PATH += ";C:\Program Files\nodejs"
cd front
npm install
npm run dev

