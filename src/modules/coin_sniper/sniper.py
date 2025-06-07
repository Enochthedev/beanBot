import os
import sys
import time
from web3 import Web3
from eth_account import Account

ROUTER_ABI = '[{"name":"swapExactETHForTokens","type":"function","inputs":[{"name":"amountOutMin","type":"uint256"},{"name":"path","type":"address[]"},{"name":"to","type":"address"},{"name":"deadline","type":"uint256"}],"outputs":[{"name":"","type":"uint256[]"}],"stateMutability":"payable"}]'
ROUTER_ADDRESS = os.getenv('ROUTER_ADDRESS', '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f')
WETH_ADDRESS = os.getenv('WETH_ADDRESS', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')


def main():
    if len(sys.argv) < 2:
        print('Usage: sniper.py <token>')
        return
    token = Web3.to_checksum_address(sys.argv[1])
    rpc = os.getenv('RPC_URL')
    key = os.getenv('PRIVATE_KEY')
    if not rpc or not key:
        print('Missing RPC_URL or PRIVATE_KEY env vars')
        return
    w3 = Web3(Web3.HTTPProvider(rpc))
    acct = Account.from_key(key)
    router = w3.eth.contract(address=ROUTER_ADDRESS, abi=ROUTER_ABI)
    deadline = int(time.time()) + 60
    tx = router.functions.swapExactETHForTokens(
        0, [WETH_ADDRESS, token], acct.address, deadline
    ).build_transaction({
        'from': acct.address,
        'value': w3.to_wei(0.01, 'ether'),
        'gas': 300000,
        'nonce': w3.eth.get_transaction_count(acct.address)
    })
    signed = acct.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f'Sniped {token} in tx {tx_hash.hex()}')


if __name__ == '__main__':
    main()
