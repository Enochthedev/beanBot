import os
import subprocess
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'sniper.py'

def test_usage_no_args(tmp_path):
    result = subprocess.run(['python', str(SCRIPT)], capture_output=True, text=True)
    assert 'Usage:' in result.stdout


def test_missing_env(tmp_path, monkeypatch):
    monkeypatch.delenv('RPC_URL', raising=False)
    monkeypatch.delenv('PRIVATE_KEY', raising=False)
    result = subprocess.run(['python', str(SCRIPT), '0x0000000000000000000000000000000000000000'], capture_output=True, text=True)
    assert 'Missing RPC_URL or PRIVATE_KEY' in result.stdout
