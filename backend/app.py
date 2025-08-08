from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, os, uuid, json, pathlib, shutil
from validators import parse_and_validate_file, validate_all_required, generate_ai_feedback
from collectors_placeholder import run_collectors_simulation

DATA_DIR = pathlib.Path('/tmp/collected_data')
DATA_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title='SAP Agentless Tool - Data Collection API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.post('/api/collect/manual')
async def collect_manual(files: list[UploadFile] = File(...), session: str = Form(None)):
    results = {}
    session_id = session or str(uuid.uuid4())
    session_dir = DATA_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    for f in files:
        filename = f.filename
        dest = session_dir / filename
        with dest.open('wb') as out:
            shutil.copyfileobj(f.file, out)
        parsed, valid, issues = parse_and_validate_file(str(dest))
        ai_feedback = generate_ai_feedback(parsed, issues)
        results[filename] = {'valid': valid, 'issues': issues, 'ai': ai_feedback}
        with open(str(session_dir / (filename + '.normalized.json')), 'w', encoding='utf-8') as nf:
            json.dump(parsed, nf, indent=2)
    overall_ok = validate_all_required(session_dir)
    return JSONResponse({'session_id': session_id, 'results': results, 'all_required_present': overall_ok})

@app.post('/api/collect/auto')
async def collect_auto(host: str = Form(...), sid: str = Form(...), client: str = Form('000'), rfc_user: str = Form(None), background: BackgroundTasks = None):
    session_id = str(uuid.uuid4())
    session_dir = DATA_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    if background:
        background.add_task(run_collectors_simulation, host, sid, client, rfc_user, str(session_dir))
        return {'session_id': session_id, 'status': 'started'}
    else:
        # try to run synchronously for demo
        run_collectors_simulation(host, sid, client, rfc_user, str(session_dir))
        return {'session_id': session_id, 'status': 'completed'}

@app.get('/api/collect/status/{session_id}')
def collect_status(session_id: str):
    session_dir = DATA_DIR / session_id
    if not session_dir.exists():
        return JSONResponse({'error':'unknown session_id'}, status_code=404)
    files = [p.name for p in session_dir.glob('*.normalized.json')]
    return {'session_id': session_id, 'files': files}

@app.post('/api/validate')
async def validate_raw(file: UploadFile = File(...), session: str = Form(None)):
    session_id = session or str(uuid.uuid4())
    session_dir = DATA_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    filename = file.filename or f'upload_{uuid.uuid4()}.dat'
    dest = session_dir / filename
    with dest.open('wb') as out:
        shutil.copyfileobj(file.file, out)
    parsed, valid, issues = parse_and_validate_file(str(dest))
    ai_feedback = generate_ai_feedback(parsed, issues)
    with open(str(session_dir / (filename + '.normalized.json')), 'w', encoding='utf-8') as nf:
        json.dump(parsed, nf, indent=2)
    return JSONResponse({'session_id': session_id, 'filename': filename, 'valid': valid, 'issues': issues, 'ai': ai_feedback})

@app.get('/api/overview/{session_id}')
def overview(session_id: str):
    session_dir = DATA_DIR / session_id
    if not session_dir.exists():
        return JSONResponse({'error':'unknown session_id'}, status_code=404)
    overview = {'session_id': session_id, 'systems': [], 'collection_files': [p.name for p in session_dir.glob('*.normalized.json')]}
    invf = session_dir / 'system_inventory.csv.normalized.json'
    if invf.exists():
        with open(str(invf),'r',encoding='utf-8') as f:
            overview['systems'] = json.load(f)
    return overview

if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=int(os.environ.get('PORT',8000)))
