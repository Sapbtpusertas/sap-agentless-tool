import pandas as pd, json, os, logging
from pathlib import Path
logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger("validators")

_model = None
_tokenizer = None
_use_hf = False

def init_local_model():
    global _model, _tokenizer, _use_hf
    if _use_hf:
        return True
    try:
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
    except Exception as e:
        _logger.info("transformers not available: %s", e)
        return False
    model_dir = os.environ.get("HF_MODEL_DIR")
    model_name = "google/flan-t5-small" if model_dir is None else model_dir
    try:
        _tokenizer = AutoTokenizer.from_pretrained(model_name, local_files_only=True)
        _model = AutoModelForSeq2SeqLM.from_pretrained(model_name, local_files_only=True)
        _use_hf = True
        _logger.info("Local HF model loaded from %s", model_name)
        return True
    except Exception as e:
        _logger.info("Failed to load local HF model: %s", e)
        return False

def text_model_generate(prompt, max_length=256):
    if not _use_hf:
        ok = init_local_model()
        if not ok:
            return None
    try:
        from transformers import pipeline
        pipe = pipeline('text2text-generation', model=_model, tokenizer=_tokenizer, device=-1)
        out = pipe(prompt, max_length=max_length, truncation=True)
        if isinstance(out, list):
            return out[0].get('generated_text') if out else None
        if isinstance(out, dict):
            return out.get('generated_text')
    except Exception as e:
        _logger.exception("Model generation failed: %s", e)
        return None

def parse_and_validate_file(path):
    p = Path(path)
    data = []
    issues = []
    try:
        if p.suffix.lower() in ['.csv', '.txt']:
            df = pd.read_csv(p)
        else:
            df = pd.read_excel(p)
        data = df.fillna('').to_dict(orient='records')
    except Exception as e:
        return ([], False, [f'Parse error: {e}'])

    cols = [c.lower() for c in list(df.columns)]
    if 'sid' in cols or 'system' in cols:
        for i, r in enumerate(data):
            if not r.get('sid') and not r.get('system'):
                issues.append(f'Row {i+1}: missing SID/system field')
    if 'last_backup' in cols:
        for i, r in enumerate(data):
            lb = r.get('last_backup')
            if not lb:
                issues.append(f'Row {i+1}: missing last_backup')
            else:
                try:
                    pd.to_datetime(lb)
                except Exception:
                    issues.append(f'Row {i+1}: invalid date format in last_backup: {lb}')
    if 'status' in cols and any('fail' in str(v).lower() for row in data for v in row.values()):
        failures = sum(1 for row in data if any('fail' in str(v).lower() for v in row.values()))
        issues.append(f'{failures} rows indicate job failure status.')

    valid = len(issues) == 0
    return (data, valid, issues)

def validate_all_required(session_dir):
    required = ['system_inventory.csv.normalized.json','db_backups.csv.normalized.json','jobs.csv.normalized.json']
    present = [p.name for p in Path(session_dir).glob('*.normalized.json')]
    missing = [r for r in required if r not in present]
    return len(missing) == 0

def generate_ai_feedback(parsed, issues):
    try:
        sample_preview = (json.dumps(parsed[:5], ensure_ascii=False) if parsed else "<empty>")
    except Exception:
        sample_preview = "<preview-unavailable>"

    prompt_lines = [
        "You are an assistant that inspects SAP exported datasets and provides clear, actionable feedback for a SAP BASIS/DBA/Integration engineer.",
        "Data preview:",
        sample_preview,
        "Detected issues:",
        "; ".join(issues) if issues else "None",
        "Provide a short summary (1-3 lines) suitable for display in a dashboard, and then a numbered list of remediation steps the user should take to fix the issues and re-upload the corrected file.",
    ]
    prompt = "\n".join(prompt_lines)

    model_resp = text_model_generate(prompt, max_length=256)
    if model_resp:
        return model_resp

    if not issues:
        return 'No issues detected. File parsed successfully.'
    lines = ["Summary: The uploaded dataset has the following issues:"]
    for it in issues:
        lines.append(f"- {it}")
    lines.append("\nRemediation steps:")
    lines.append("1) Re-export the dataset from the source SAP transaction ensuring mandatory fields are included.")
    lines.append("2) Correct the row-level issues reported and re-upload.")
    lines.append("3) If unsure, attach the file and contact basis team with the error lines.")
    return "\n".join(lines)
