import time, json, random, os

def run_collectors_simulation(host, sid, client, rfc_user, session_dir):
    os.makedirs(session_dir, exist_ok=True)
    time.sleep(1)
    systems = [{'sid': sid, 'host': host, 'client': client}]
    with open(os.path.join(session_dir, 'system_inventory.csv.normalized.json'),'w',encoding='utf-8') as f:
        json.dump(systems, f, indent=2)
    time.sleep(0.5)
    jobs = [{'job':'Z_MONTH_END','status':'FAILED' if random.random()>0.7 else 'OK'}]
    with open(os.path.join(session_dir, 'jobs.csv.normalized.json'),'w',encoding='utf-8') as f:
        json.dump(jobs, f, indent=2)
    time.sleep(0.5)
    backups = [{'sid': sid, 'last_backup':'2025-07-30'}]
    with open(os.path.join(session_dir, 'db_backups.csv.normalized.json'),'w',encoding='utf-8') as f:
        json.dump(backups, f, indent=2)
    rfcs = [{'rfc':'DEST01','auth':'USERPWD'}]
    with open(os.path.join(session_dir, 'rfc_dest.csv.normalized.json'),'w',encoding='utf-8') as f:
        json.dump(rfcs, f, indent=2)
    sld = [{'sid': sid, 'owner':'Finance'}]
    with open(os.path.join(session_dir, 'sld_lmdb.csv.normalized.json'),'w',encoding='utf-8') as f:
        json.dump(sld, f, indent=2)
    return True
