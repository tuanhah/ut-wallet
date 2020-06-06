import * as DBUtils from './DBUtils';
import * as Utils from './Utils';
import * as _ from 'lodash';
import { EntityManager } from 'typeorm';
import axios from 'axios';
import { GatewayRegistry, BaseGateway } from '../../../sota-common';
import { getLogger, Account, CurrencyRegistry, BlockchainPlatform } from 'sota-common';
import Kms from '../encrypt/Kms';

const logger = getLogger('AdaWalletService');
export async function createAdaAddresses(amount: number, currency: string, connection: EntityManager) {
  const wallet = await DBUtils.findOrCreateAdaWallet(currency, connection);
  const secret = JSON.parse(wallet.secret);
  if (!secret) {
    throw new Error('This currency do not have wallet');
  }
  let seed;
  if (secret.private_key) {
    seed = secret.private_key;
    if (secret.kms_data_key_id > 0) {
      seed = await Kms.getInstance().decrypt(secret.private_key, secret.kms_data_key_id);
    }
  }
  const tasks: Array<Promise<any>> = [];
  for (let i = 0; i < amount; i++) {
    tasks.push(_generateOneAdaWalletAddress(currency, wallet.id, seed, wallet.secret));
  }
  const accounts: Account[] = await Promise.all(tasks);
  await DBUtils.saveNotHDAddresses(wallet.id, currency, accounts, JSON.parse(seed).account_id, connection);
  return accounts.map(pair => pair.address);
}

export async function _generateAdaAccount(coin: string, params: any) {
  let account;
  try {
    account = await createAdaAccount(coin, params);
  } catch (e) {
    console.error(e);
    throw new Error(`Could not create Ada account params=${JSON.stringify(params)}`);
  }

  if (_.isNil(account)) {
    throw new Error(`Could not create wallet coin=${coin}`);
  }

  if (
    !account.wallet_address ||
    !account.account_id ||
    !account.backup_phrase ||
    !account.spending_password ||
    typeof account.account_id !== 'number'
  ) {
    throw new Error(`Could not create ADA wallet err=$`);
  }

  const private_key = JSON.stringify(account);
  return private_key;
}

export async function _generateOneAdaWalletAddress(
  coin: string,
  walletId: number,
  secret: string,
  walletSecret: string
) {
  const iCurrency = CurrencyRegistry.getOneCurrency(BlockchainPlatform.Cardano);
  const gw = GatewayRegistry.getGatewayInstance(iCurrency);
  let newSecret;
  try {
    newSecret = JSON.parse(secret);
  } catch (e) {
    throw new Error(e);
  }
  if (!newSecret.wallet_address || !newSecret.account_id || !newSecret.backup_phrase || !newSecret.spending_password) {
    throw new Error('Fail');
  }
  const data = await (gw as any).createWalletAddress(
    newSecret.wallet_address,
    newSecret.account_id,
    newSecret.backup_phrase,
    newSecret.spending_password
  );
  if (_.isNil(data)) {
    throw new Error(`Get Address fail coin=${coin}, wallet_id=${walletId}`);
  }

  if (
    typeof data.address === 'undefined' ||
    typeof data.walletId === 'undefined' ||
    typeof data.accountId === 'undefined' ||
    typeof data.spendingPassword === 'undefined' ||
    typeof data.backupPhrase === 'undefined'
  ) {
    logger.error(`Get Address fail err`);
    throw new Error(`Get Address fail err`);
  }

  // Just in case, satefy check to the integrity
  // This case should never happen. But since we're storing redundant data, just check for sure
  if (
    data.walletId !== newSecret.wallet_address ||
    data.accountId !== newSecret.account_id ||
    data.spendingPassword !== newSecret.spending_password ||
    data.backupPhrase !== newSecret.backup_phrase
  ) {
    logger.error(`Mismatch between recent generated ADA address and the wallet walletId=${walletId}`);
    throw new Error(`Server unknown error`);
  }
  return new Account(walletSecret, data.address);
}

export async function createAdaAccount(coin: string, params: any): Promise<any> {
  const iCurrency = CurrencyRegistry.getOneCurrency(BlockchainPlatform.Cardano);
  const gw = GatewayRegistry.getGatewayInstance(iCurrency);

  try {
    const walletName: string = params.wallet_name;

    console.log(`AdaWebService::createNewWallet begin params=${JSON.stringify(params)}`);
    const wallet = await (gw as any).createWallet(walletName);
    const walletInfo = wallet.wallet_address + '-' + wallet.account_id;
    console.log(`AdaWebService::createNewWallet done params=${JSON.stringify(params)} result=${walletInfo}`);
    return wallet;
  } catch (e) {
    throw new Error(e.toString() + `: Could not create ADA account params=${JSON.stringify(params)}`);
  }
}
