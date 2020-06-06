# Wallet module for Amanpuri Exchange

# How to setup & deploy wallet?

## Clone project
```
git clone https://github.com/sotatek-dev/amanpuri-wallet.git
```

## Install dependencies
- Node v10
```
// Go https://nodejs.org/en/
```
- Typescript: 3.2.2
```
npm i -g typescript@3.2.2
```
- PM2: 3.4.0
```
npm i -g pm2@3.4.0
```
- Redis any version (latest one is recommended though)
```
// Google for instruction
```
- Database: MySQL Server

## Setup
- Install module packages:
```
make all
```
- Copy environments:
```
cp .env.example .env
cp dist/.env.example dist/.env
```

Notes: here is example env config
- in _dist/.env.example_
```
# GENERAL CONFIGURATION
NODE_ENV=development
LOG_LEVEL=DEBUG

# DATABASE CONFIGURATION
TYPEORM_HOST=<db_host, default: localhost>
TYPEORM_USERNAME=<db_username>
TYPEORM_PASSWORD=<db_password>
TYPEORM_DATABASE=<db_name>
TYPEORM_PORT=<db_port, default: 3306>
TYPEORM_ENTITIES=libs/wallet-core/src/entities/**/*,libs/sota-btc/src/entities/**/*,bin/typeorm_migration/src/entity/**/*
TYPEORM_MIGRATION=bin/typeorm_migration/src/migration/**/*
TYPEORM_MIGRATION_TABLE=migrations
#TYPEORM_PREFIX=

REDIS_HOST=<redis_host, default: localhost>
REDIS_PORT=<redis_port, default: 6379>
INTERNAL_HOST_IP=<internal_hot_ip>
```

- in .env.example_
```
# GENERAL CONFIGURATION
NODE_ENV=development
LOG_LEVEL=DEBUG

# DATABASE CONFIGURATION
TYPEORM_HOST=<db_host, default: localhost>
TYPEORM_USERNAME=<db_username>
TYPEORM_PASSWORD=<db_password>
TYPEORM_DATABASE=<db_name>
TYPEORM_PORT=<db_port, default: 3306>
TYPEORM_ENTITIES=libs/wallet-core/src/entities/**/*,libs/sota-btc/src/entities/**/*,bin/typeorm_migration/src/entity/**/*
TYPEORM_MIGRATION=bin/typeorm_migration/src/migration/**/*
TYPEORM_MIGRATION_TABLE=migrations
#TYPEORM_PREFIX=

REDIS_HOST=<redis_host, default: localhost>
REDIS_PORT=<redis_port, default: 6379>
INTERNAL_HOST_IP=<internal_hot_ip>
```

- Run migration & seed data:
```
make migrations
```

## Database configures:
- `kms_cmk`
```
INSERT INTO `kms_cmk` (`id`, `region`, `alias`, `arn`, `is_enabled`, `created_at`, `updated_at`)
VALUES
	('<cmk id>', '<cmk region>', '<cmk alias>', '<cmk arn>', 1, now(), now());

```
- `currency_config`
```
UPDATE `currency_config` SET `rpc_endpoint` = '<fullnode IP address BTC>' WHERE `currency` = 'btc';
UPDATE `currency_config` SET `rest_endpoint` = '<fullnode REST API BTC>' WHERE `currency` = 'btc';
UPDATE `currency_config` SET `rpc_endpoint` = '<fullnode IP address LTC>' WHERE `currency` = 'ltc';
UPDATE `currency_config` SET `rest_endpoint` = '<fullnode REST API LTC>' WHERE `currency` = 'ltc';
UPDATE `currency_config` SET `rest_endpoint` = '<fullnode REST API BCH>' WHERE `currency` = 'bch';
UPDATE `currency_config` SET `rpc_endpoint` = '<fullnode IP address BCH>' WHERE `currency` = 'bch';
UPDATE `currency_config` SET `rest_endpoint` = '<fullnode REST API ADA>' WHERE `currency` = 'ada';
UPDATE `currency_config` SET `rest_endpoint` = '<fullnode REST API EOS>' WHERE `currency` = 'eos';
UPDATE `currency_config` SET `chain_id` = '5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191' WHERE `currency` = 'eos';
UPDATE `currency_config` SET `rest_endpoint` = '<fullnode REST API ETH>' WHERE `currency` = 'eth';
UPDATE `currency_config` SET `chain_id` = '1' WHERE `currency` = 'eth';
UPDATE `currency_config` SET `rest_endpoint` = '<fullnode REST API>' WHERE `currency` = 'xrp';

```
- `env_config`

| Key | Value |
| --- | ----- |
| MAIL_DRIVER | smtp |
| MAIL_ENCRYPTION | tls |
| MAIL_USERNAME	| mailer.username |
| MAIL_PASSWORD | SuperSecretPassword |
| MAIL_HOST | mail_host |
| MAIL_PORT | 587 |
| MAIL_FROM_NAME | Amanpuri |
| MAIL_FROM_ADDRESS | noreply@amanpuri.io |
| MAILER_RECEIVER | ops@amanpuri.com |
| WEBHOOK_REQUEST_PASSWORD | SecretExchangePassword |
| WEBHOOK_REQUEST_USER | ExchangeUser |
| NETWORK | mainnet |


- `erc20_token`: Make sure that you have created a record that register AMAL token

| symbol | origin_symbol | contract_address | decimal | total_supply | network |
| ------ | ------------- | ---------------- | ------- | ------------ | ------- |
| erc20.0xBFd78659212F00dE65A6411DAdC75878930725Ec | AMAL | 0xBFd78659212F00dE65A6411DAdC75878930725Ec | 8 | 210000000 | mainnet |

- `webhook`: Make sure that you have created a records in the webhook table to alert the events concerning the exchange's addresses to your exchange

| id | user_id | type | url |
| -- | ------- | ---- | --- |
| 1 | 1 | common | <exchange_webhook_url> |

## Start process:
```
cd dist
pm2 start app_web.json
pm2 start app_ada.json
pm2 start app_bch.json
pm2 start app_btc.json
pm2 start app_eos.json
pm2 start app_eth.json
pm2 start app_ltc.json
pm2 start app_xrp.json

```
If successful, you will see like below:
```
┌───────────────────────────────┬────┬─────────┬──────┬───────┬────────┬─────────┬────────┬──────┬────────────┬────────┬──────────┐
│ App name                      │ id │ version │ mode │ pid   │ status │ restart │ uptime │ cpu  │ mem        │ user   │ watching │
├───────────────────────────────┼────┼─────────┼──────┼───────┼────────┼─────────┼────────┼──────┼────────────┼────────┼──────────┤
│ hot-wallet-CheckBalanceWorker │ 35 │ 1.0.0   │ fork │ 27312 │ online │ 5       │ 19D    │ 0.3% │ 97.2 MB    │ ubuntu │ disabled │
│ hot-wallet-WebService         │ 1  │ 1.0.0   │ fork │ 24558 │ online │ 2       │ 20D    │ 0.2% │ 96.6 MB    │ ubuntu │ disabled │
│ hot-wallet-Webhook            │ 0  │ 1.0.0   │ fork │ 24552 │ online │ 2       │ 20D    │ 0.3% │ 99.7 MB    │ ubuntu │ disabled │
│ hot-wallet-ada-webservice     │ 5  │ 1.0.0   │ fork │ 24646 │ online │ 2       │ 20D    │ 0.2% │ 102.1 MB   │ ubuntu │ disabled │
│ hot-wallet-alert-worker       │ 41 │ 1.0.0   │ fork │ 24753 │ online │ 2       │ 20D    │ 0.1% │ 94.6 MB    │ ubuntu │ disabled │
│ hot-wallet-bch-collector      │ 28 │ 1.0.0   │ fork │ 23727 │ online │ 1       │ 20D    │ 0.2% │ 102.2 MB   │ ubuntu │ disabled │
│ hot-wallet-bch-crawler        │ 23 │ 1.0.0   │ fork │ 23617 │ online │ 1       │ 20D    │ 0.2% │ 207.2 MB   │ ubuntu │ disabled │
│ hot-wallet-bch-picker         │ 24 │ 1.0.0   │ fork │ 23631 │ online │ 1       │ 20D    │ 0.3% │ 104.7 MB   │ ubuntu │ disabled │
│ hot-wallet-bch-sender         │ 26 │ 1.0.0   │ fork │ 23692 │ online │ 1       │ 20D    │ 0.1% │ 99.4 MB    │ ubuntu │ disabled │
│ hot-wallet-bch-signer         │ 25 │ 1.0.0   │ fork │ 23643 │ online │ 1       │ 20D    │ 0.1% │ 98.9 MB    │ ubuntu │ disabled │
│ hot-wallet-bch-verifier       │ 27 │ 1.0.0   │ fork │ 23707 │ online │ 1       │ 20D    │ 0.1% │ 100.8 MB   │ ubuntu │ disabled │
│ hot-wallet-bch-webservice     │ 6  │ 1.0.0   │ fork │ 24680 │ online │ 2       │ 20D    │ 0.2% │ 100.7 MB   │ ubuntu │ disabled │
│ hot-wallet-btc-collector      │ 14 │ 1.0.0   │ fork │ 23423 │ online │ 1       │ 20D    │ 0.1% │ 103.8 MB   │ ubuntu │ disabled │
│ hot-wallet-btc-crawler        │ 9  │ 1.0.0   │ fork │ 23322 │ online │ 1       │ 20D    │ 9.1% │ 387.4 MB   │ ubuntu │ disabled │
│ hot-wallet-btc-fee-seeder     │ 15 │ 1.0.0   │ fork │ 23444 │ online │ 1       │ 20D    │ 0.1% │ 98.8 MB    │ ubuntu │ disabled │
│ hot-wallet-btc-picker         │ 10 │ 1.0.0   │ fork │ 23354 │ online │ 1       │ 20D    │ 0.3% │ 107.7 MB   │ ubuntu │ disabled │
│ hot-wallet-btc-sender         │ 12 │ 1.0.0   │ fork │ 23385 │ online │ 1       │ 20D    │ 0.1% │ 100.8 MB   │ ubuntu │ disabled │
│ hot-wallet-btc-signer         │ 11 │ 1.0.0   │ fork │ 23359 │ online │ 1       │ 20D    │ 0.2% │ 104.9 MB   │ ubuntu │ disabled │
│ hot-wallet-btc-verifier       │ 13 │ 1.0.0   │ fork │ 23396 │ online │ 1       │ 20D    │ 0.1% │ 201.9 MB   │ ubuntu │ disabled │
│ hot-wallet-btc-webservice     │ 2  │ 1.0.0   │ fork │ 24600 │ online │ 2       │ 20D    │ 0.2% │ 191.5 MB   │ ubuntu │ disabled │
│ hot-wallet-eos-crawler        │ 42 │ 1.0.0   │ fork │ 27185 │ online │ 11      │ 19D    │ 9.5% │ 178.1 MB   │ ubuntu │ disabled │
│ hot-wallet-eos-picker         │ 43 │ 1.0.0   │ fork │ 24204 │ online │ 7       │ 5D     │ 0.3% │ 102.8 MB   │ ubuntu │ disabled │
│ hot-wallet-eos-sender         │ 44 │ 1.0.0   │ fork │ 27222 │ online │ 6       │ 19D    │ 0.2% │ 99.8 MB    │ ubuntu │ disabled │
│ hot-wallet-eos-signer         │ 46 │ 1.0.0   │ fork │ 27269 │ online │ 6       │ 19D    │ 0.2% │ 99.8 MB    │ ubuntu │ disabled │
│ hot-wallet-eos-verifier       │ 45 │ 1.0.0   │ fork │ 27232 │ online │ 6       │ 19D    │ 0.2% │ 98.8 MB    │ ubuntu │ disabled │
│ hot-wallet-eos-webservice     │ 8  │ 1.0.0   │ fork │ 24720 │ online │ 3       │ 20D    │ 0.3% │ 96.3 MB    │ ubuntu │ disabled │
│ hot-wallet-eth-collector      │ 21 │ 1.0.0   │ fork │ 395   │ online │ 4       │ 16D    │ 0.1% │ 112.4 MB   │ ubuntu │ disabled │
│ hot-wallet-eth-crawler        │ 16 │ 1.0.0   │ fork │ 31947 │ online │ 2       │ 17D    │ 3.5% │ 187.1 MB   │ ubuntu │ disabled │
│ hot-wallet-eth-fee-seeder     │ 22 │ 1.0.0   │ fork │ 23610 │ online │ 1       │ 20D    │ 0.1% │ 112.2 MB   │ ubuntu │ disabled │
│ hot-wallet-eth-picker         │ 17 │ 1.0.0   │ fork │ 23501 │ online │ 1       │ 20D    │ 0.1% │ 115.6 MB   │ ubuntu │ disabled │
│ hot-wallet-eth-sender         │ 18 │ 1.0.0   │ fork │ 23531 │ online │ 1       │ 20D    │ 0.2% │ 110.8 MB   │ ubuntu │ disabled │
│ hot-wallet-eth-signer         │ 19 │ 1.0.0   │ fork │ 23535 │ online │ 1       │ 20D    │ 0.1% │ 110.7 MB   │ ubuntu │ disabled │
│ hot-wallet-eth-verifier       │ 20 │ 1.0.0   │ fork │ 23561 │ online │ 1       │ 20D    │ 0.1% │ 127.5 MB   │ ubuntu │ disabled │
│ hot-wallet-eth-webservice     │ 3  │ 1.0.0   │ fork │ 24606 │ online │ 2       │ 20D    │ 0.3% │ 119.7 MB   │ ubuntu │ disabled │
│ hot-wallet-ltc-collector      │ 34 │ 1.0.0   │ fork │ 23837 │ online │ 1       │ 20D    │ 0.1% │ 103.8 MB   │ ubuntu │ disabled │
│ hot-wallet-ltc-crawler        │ 29 │ 1.0.0   │ fork │ 23732 │ online │ 1       │ 20D    │ 0.1% │ 158.0 MB   │ ubuntu │ disabled │
│ hot-wallet-ltc-picker         │ 30 │ 1.0.0   │ fork │ 23763 │ online │ 1       │ 20D    │ 0.4% │ 105.9 MB   │ ubuntu │ disabled │
│ hot-wallet-ltc-sender         │ 32 │ 1.0.0   │ fork │ 23798 │ online │ 1       │ 20D    │ 0.1% │ 96.2 MB    │ ubuntu │ disabled │
│ hot-wallet-ltc-signer         │ 31 │ 1.0.0   │ fork │ 23769 │ online │ 1       │ 20D    │ 0.2% │ 101.0 MB   │ ubuntu │ disabled │
│ hot-wallet-ltc-verifier       │ 33 │ 1.0.0   │ fork │ 23820 │ online │ 1       │ 20D    │ 0.2% │ 98.5 MB    │ ubuntu │ disabled │
│ hot-wallet-ltc-webservice     │ 7  │ 1.0.0   │ fork │ 24695 │ online │ 2       │ 20D    │ 0.3% │ 98.1 MB    │ ubuntu │ disabled │
│ hot-wallet-xrp-crawler        │ 36 │ 1.0.0   │ fork │ 32545 │ online │ 2       │ 17D    │ 0.2% │ 112.3 MB   │ ubuntu │ disabled │
│ hot-wallet-xrp-picker         │ 37 │ 1.0.0   │ fork │ 32551 │ online │ 2       │ 17D    │ 0.3% │ 108.7 MB   │ ubuntu │ disabled │
│ hot-wallet-xrp-sender         │ 38 │ 1.0.0   │ fork │ 32590 │ online │ 2       │ 17D    │ 0.1% │ 106.0 MB   │ ubuntu │ disabled │
│ hot-wallet-xrp-signer         │ 40 │ 1.0.0   │ fork │ 32633 │ online │ 2       │ 17D    │ 0.1% │ 105.0 MB   │ ubuntu │ disabled │
│ hot-wallet-xrp-verifier       │ 39 │ 1.0.0   │ fork │ 32596 │ online │ 2       │ 17D    │ 0.2% │ 103.8 MB   │ ubuntu │ disabled │
│ hot-wallet-xrp-webservice     │ 4  │ 1.0.0   │ fork │ 24640 │ online │ 2       │ 20D    │ 0.2% │ 100.6 MB   │ ubuntu │ disabled │
│ hot-wallet-ada-crawler        │ 50 │ 1.0.0   │ fork │ 32545 │ online │ 2       │ 17D    │ 0.2% │ 112.3 MB   │ ubuntu │ disabled │
│ hot-wallet-ada-picker         │ 51 │ 1.0.0   │ fork │ 32551 │ online │ 2       │ 17D    │ 0.3% │ 108.7 MB   │ ubuntu │ disabled │
│ hot-wallet-ada-sender         │ 52 │ 1.0.0   │ fork │ 32590 │ online │ 2       │ 17D    │ 0.1% │ 106.0 MB   │ ubuntu │ disabled │
│ hot-wallet-ada-signer         │ 53 │ 1.0.0   │ fork │ 32633 │ online │ 2       │ 17D    │ 0.1% │ 105.0 MB   │ ubuntu │ disabled │
│ hot-wallet-ada-verifier       │ 54 │ 1.0.0   │ fork │ 32596 │ online │ 2       │ 17D    │ 0.2% │ 103.8 MB   │ ubuntu │ disabled │
│ hot-wallet-ada-webservice     │ 55 │ 1.0.0   │ fork │ 24640 │ online │ 2       │ 20D    │ 0.2% │ 100.6 MB   │ ubuntu │ disabled │
└───────────────────────────────┴────┴─────────┴──────┴───────┴────────┴─────────┴────────┴──────┴────────────┴────────┴──────────┘

```
## Insert hot wallet address Xrp, EOS

For Xrp, EOS, you have to generate the address manually. Then, you insert to the system by calling API (POST)
```
{{HOST}}:{{PORT}}/api/:currency/add_address
```
Example body request inserting EOS hot wallet: 
```
{
	"address": "amanpuritest",
	"private_key": {
		"ownerKey": "ownerKey_account",
		"activeKey": "activeKey_account"
	}
}
```
Example body request inserting Xrp hot wallet: 
```
{
	"address": "xrp_account",
	"private_key": "private_key"
}
```
