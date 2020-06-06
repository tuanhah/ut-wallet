import * as DBUtils from './DBUtils';
import {
  CurrencyRegistry,
  ICurrency,
  BigNumber,
  GatewayRegistry,
  Account,
  Utils,
  getLogger,
  BlockchainPlatform,
} from 'sota-common';
import { EntityManager } from 'typeorm';
import { indexOfHotWallet } from './Const';
import * as rawdb from '../rawdb';
import Kms from '../encrypt/Kms';
import * as bip39 from 'bip39';
import { findTotalAmountWithdrawlPending } from '../rawdb';
import { WithdrawalStatus } from '../Enums';
import * as utilize from '../hd_wallet';
const hdkey = require('hdkey');
const logger = getLogger('Web Service');

export async function createAddresses(coin: string, amount: number, connection: EntityManager): Promise<string[]> {
  const iCurrency = CurrencyRegistry.getOneCurrency(coin);

  if (amount < 0) {
    throw new Error('Amount must be greater than 0!');
  }

  if (!iCurrency) {
    throw new Error('Incorrect currency!');
  }
  const dataKey = await DBUtils.getRandomKms(connection);
  const currency = iCurrency.platform;
  const path = await findPathCurrency(currency, connection);
  const wallet = await DBUtils.findOrCreateWallet(currency, connection);
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
  } else {
    throw new Error(`Invalid secret format for wallet id=${wallet.id}`);
  }

  await createHotWallet(wallet.id, seed, currency, connection, path, dataKey);
  const count = await DBUtils.countAddresses(currency, connection);
  return await createAndSaveAddresses(wallet.id, seed, count, amount, currency, connection, dataKey);
}

export async function createAndSaveAddresses(
  walletId: number,
  seeder: string,
  index: number,
  amount: number,
  currency: string,
  connection: EntityManager,
  dataKey: any
): Promise<string[]> {
  const newIndex = calIndex(index);
  const seed = await bip39.mnemonicToSeed(seeder); // creates seed buffer
  const path = await findPathCurrency(currency, connection);
  const tasks: Array<Promise<any>> = [];
  for (let i = newIndex; i < newIndex + amount; i++) {
    tasks.push(createAnAddress(seed, path, i, currency, dataKey));
  }
  const listPairs = await Promise.all(tasks);
  await DBUtils.saveAddresses(walletId, currency, listPairs, path, newIndex, connection);
  return listPairs.map(pair => pair.address);
}

export async function createAnAddress(seed: Buffer, path: string, index: number, currency: string, dataKey: any) {
  const root = hdkey.fromMasterSeed(seed);
  const addrnode = root.derive(path + index.toString());
  const privateKey = addrnode._privateKey.toString('hex');
  const gateway = await GatewayRegistry.getGatewayInstance(currency);
  const account = await gateway.getAccountFromPrivateKey(privateKey);
  let kms_data_key_id;
  let private_key;
  if (!dataKey || !dataKey.id) {
    kms_data_key_id = 0;
    private_key = privateKey;
  } else {
    kms_data_key_id = dataKey.id;
    private_key = await Kms.getInstance().encrypt(privateKey, kms_data_key_id);
  }
  return new Account(JSON.stringify({ private_key, kms_data_key_id }), account.address);
}

export async function createHotWallet(
  walletId: number,
  seeder: string,
  currency: string,
  connection: EntityManager,
  path: string,
  dataKey: any
) {
  const seed = await bip39.mnemonicToSeed(seeder); // creates seed buffer
  await DBUtils.saveHotWallet(
    path,
    await createAnAddress(seed, path, indexOfHotWallet, currency, dataKey),
    currency,
    walletId,
    connection
  );
}

export async function calPrivateKeyHotWallet(
  address: string,
  currency: string,
  connection: EntityManager
): Promise<string> {
  const secretHotWallet = await DBUtils.findHotWalletWithAddress(address, currency, connection);
  return secretHotWallet.secret;
}

function calIndex(number: number) {
  return number + 100;
}

export async function approveTransaction(
  connection: EntityManager,
  coin: string,
  toAddress: string,
  amount: number,
  tag?: string
) {
  const iCurrency = CurrencyRegistry.getOneCurrency(coin);
  const currency = iCurrency.platform;
  const wallet = await DBUtils.findOrCreateWallet(currency, connection);
  const balance = await DBUtils.findWalletBalance(wallet.id, coin, connection);

  if (!amount) {
    throw new Error('Invalid Amount!');
  }

  if (!(await validateAddress(currency, toAddress))) {
    throw new Error('Invalid Address');
  }

  if (await checkInternalddress(toAddress, connection)) {
    throw new Error('Destination Address is internal');
  }

  if (!balance) {
    throw new Error('Dont have wallet of this currency');
  }

  if (!new BigNumber(amount).isGreaterThan(0)) {
    throw new Error('amount greater than 0');
  }

  // if (!isNormalInteger(amount.toString())) {
  //   throw new Error('amount is not positive integer');
  // }

  if (new BigNumber(amount).isGreaterThan(balance.balance)) {
    const hotWallet = await DBUtils.findHotWalletWithoutAddress(currency, connection);
    const withdrawalPending = await findTotalAmountWithdrawlPending(coin, connection);
    const amountOfMoneyMissing = new BigNumber(withdrawalPending).minus(balance.balance);
    const receiptAddress = await DBUtils.findRealReceiptAddress(
      hotWallet.address,
      currency,
      hotWallet.walletId,
      connection
    );
    await utilize.sendMailInsufficientBalance(
      receiptAddress,
      connection,
      iCurrency,
      balance.balance,
      amount.toString(),
      amountOfMoneyMissing.toString()
    );
    logger.info(
      `Amount withdrawal: ${amount} is greater than Balance: ${balance.balance} of hot wallet:  ${coin} wallet`
    );
  }
  const withdrawalId = await DBUtils.insertWithdrawalRecord(connection, coin, wallet.id, toAddress, amount, tag);
  if (!withdrawalId) {
    throw new Error('Server Error!');
  }
  return withdrawalId;
}
function isNormalInteger(str: any) {
  const n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}
export async function findId(id: number, connection: EntityManager) {
  return DBUtils.findIdDB(id, connection);
}

export async function findTxHash(id: number, connection: EntityManager) {
  return DBUtils.findTxHashDB(id, connection);
}

export async function getNetwork(connection: EntityManager) {
  return DBUtils.getNetworkDB(connection);
}

export async function findPathCurrency(currency: string, connection: EntityManager) {
  return DBUtils.findHdPathDB(currency, connection);
}

export async function saveThreshold(
  currency: string,
  address: string,
  upperThreshold: number,
  lowerThreshold: number,
  manager: EntityManager
) {
  const iCurrency = CurrencyRegistry.getOneCurrency(currency);
  if (!upperThreshold || !lowerThreshold || !address || !currency) {
    throw new Error('Required upperThreshold, lowerThreshold, address, currency');
  }
  const platformCurrency = iCurrency.platform;
  if (!new BigNumber(upperThreshold).isGreaterThanOrEqualTo(lowerThreshold)) {
    throw new Error('upperThreshold must be greater than lowerThreshold');
  }
  if (address) {
    if (!(await validateAddress(platformCurrency, address))) {
      throw new Error('Invalid address of ' + currency);
    }
  }
  await Utils.PromiseAll([
    DBUtils.saveCurrencyThresholdInfor(currency, lowerThreshold, upperThreshold, manager),
    DBUtils.saveColdWallet(currency, address, manager, platformCurrency),
  ]);
  const hotWallet = await DBUtils.findHotWalletWithoutAddress(platformCurrency, manager);
  if (!hotWallet) {
    throw new Error(`This currency: ${currency} don't have hot wallet!`);
  }
  const isBusy = await rawdb.checkHotWalletIsBusy(manager, hotWallet, [
    WithdrawalStatus.SIGNED,
    WithdrawalStatus.SENT,
    WithdrawalStatus.SIGNING,
    WithdrawalStatus.UNSIGNED,
  ]);
  if (isBusy) {
    logger.info(`Hot wallet address=${hotWallet.address} is busy, ignore collecting`);
    return;
  }

  await rawdb.upperThresholdHandle(manager, iCurrency, hotWallet);
}

export async function getSettingThreshold(connection: EntityManager) {
  return await Utils.PromiseAll([DBUtils.getSettingThresholdDB(connection), DBUtils.mailerReceive(connection)]);
}

export async function validateAddress(currency: string, address: string) {
  if (await GatewayRegistry.getGatewayInstance(currency).isValidAddressAsync(address)) {
    return true;
  }
  return false;
}

export async function addErc20(
  symbol: string,
  name: string,
  contracAddress: string,
  decimal: number,
  manager: EntityManager
) {
  if (!symbol || !name || !contracAddress || !decimal) {
    throw new Error('Server Error');
  }
  await DBUtils.addErc20DB(symbol, name, contracAddress, decimal, manager);
}

export async function statisticalHotWallet(currency: string, manager: EntityManager) {
  if (!currency) {
    throw new Error('Incorrect currency');
  }
  const iCurrency = CurrencyRegistry.getOneCurrency(currency);
  if (!iCurrency) {
    throw new Error('Incorrect currency');
  }
  const gw = GatewayRegistry.getGatewayInstance(iCurrency);

  if (!gw) {
    throw new Error(`Cannot get Gateway of currnecy: ${currency}`);
  }

  const [
    coldWalletAddress,
    feeCollectColdWallet,
    feeCollectHotWallet,
    hotWalletAddress,
    feeCollectTokenColdWallet,
    feeCollectTokenHotWallet,
  ] = await Utils.PromiseAll([
    DBUtils.findColdWallet(iCurrency.platform, manager),
    DBUtils.feeCollectColdWallet(currency, manager),
    DBUtils.feeCollectHotWallet(currency, manager),
    DBUtils.findHotWalletWithoutAddress(iCurrency.platform, manager),
    DBUtils.feeCollectTokenColdWallet(currency, manager),
    DBUtils.feeCollectTokenHotWallet(currency, manager),
  ]);
  let realAmountCollectColdWallet = new BigNumber(0);
  const realFeeCollectHotWallet = new BigNumber(feeCollectHotWallet || 0)
    .plus(feeCollectTokenHotWallet.totalFeeSeedCollectHotWallet || 0)
    .plus(feeCollectTokenHotWallet.totalAmountSeedCollectHotWallet || 0);
  if (!hotWalletAddress) {
    throw new Error(`Dont have hot wallet of this currency: ${currency}`);
  }
  if (coldWalletAddress) {
    if (currency === BlockchainPlatform.Cardano) {
      
    } else {
      realAmountCollectColdWallet = await gw.getAddressBalance(coldWalletAddress.address);
    }
  }
  const hotWalletBalance = await gw.getAddressBalance(hotWalletAddress.address);
  const totalBalance = new BigNumber(hotWalletBalance || 0).plus(realAmountCollectColdWallet || 0);
  const realFeeCollectColdWallet = new BigNumber(feeCollectColdWallet || 0).plus(feeCollectTokenColdWallet || 0);
  return {
    hotWalletAddress: hotWalletAddress.address,
    totalBalance: totalBalance.toString() || '0',
    hotWalletBalance: hotWalletBalance.toString() || '0',
    amountCollectColdWallet: realAmountCollectColdWallet.toString() || '0',
    feeCollectColdWallet: realFeeCollectColdWallet.toString() || '0',
    feeCollectHotWallet: realFeeCollectHotWallet.toString() || '0',
  };
}

export async function generateSeed(manager: EntityManager) {
  const mnemonic = bip39.generateMnemonic();
  const dataKey = await DBUtils.getRandomKms(manager);
  if (!dataKey || !dataKey.id) {
    throw new Error(`KMS data key is mandatory...`);
  }

  const kms_data_key_id = dataKey.id;
  const private_key = await Kms.getInstance().encrypt(mnemonic, kms_data_key_id);

  return {
    private_key,
    kms_data_key_id,
  };
}

export async function addAddressOneAddressCurrency(
  currency: string,
  address: string,
  privateKey: string,
  manager: EntityManager
) {
  if (!validateAddress(currency, address)) {
    throw new Error(`Invalid address: ${address} for currency: ${currency}`);
  }
  await DBUtils.addAddressOneAddressCurrencyDB(currency, address, privateKey, manager);
}

export function getNetworkName(currency: ICurrency) {
  if (currency.isNative) {
    return currency.symbol;
  }
  return currency.name;
}

export function convertHumanReadableScale(currency: ICurrency, amount: BigNumber) {
  return amount.div(Math.pow(10, currency.humanReadableScale)).toString();
}

export async function checkInternalddress(address: string, manager: EntityManager) {
  return (await DBUtils.findAddress(address, manager)) ? true : false;
}

export function convertHtml(text: string) {
  return '<p>' + text.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
}
