import {
  getLogger,
  Utils,
  BasePlatformWorker,
  CurrencyRegistry,
  IRawTransaction,
  GatewayRegistry,
  BitcoinBasedGateway,
  AccountBasedGateway,
  BigNumber,
  IBoiledVOut,
  IInsightUtxoInfo,
  ICurrency,
  ISignedRawTransaction,
} from 'sota-common';
import { EntityManager, getConnection } from 'typeorm';
import _ from 'lodash';
import * as rawdb from '../../rawdb';
import { CollectStatus, InternalTransferType, WithdrawalStatus } from '../../Enums';
import { Deposit, Address, InternalTransfer } from '../../entities';

const logger = getLogger('collectorDoProcess');

export async function collectorDoProcess(collector: BasePlatformWorker): Promise<void> {
  await getConnection().transaction(async manager => {
    await _collectorDoProcess(manager, collector);
  });
}

/**
 * Tasks of collector:
 * - Find uncollected deposits
 *   + If the deposit currency is account-based, just take 1 record
 *   + If the deposit currency is utxo-based, take multiple records
 * - If the deposit amount is too small, just skip. We'll wait until the funds is big enough
 * - Find an internal hot wallet
 * - Send fee to deposit address if needed to collect tokens (ERC20, USDT, ...)
 * - Make transaction that transfer funds from deposit addresses to the hot wallet
 *
 * @param manager
 * @param picker
 * @private
 */
async function _collectorDoProcess(manager: EntityManager, collector: BasePlatformWorker): Promise<void> {
  const platformCurrency = collector.getCurrency();
  const platformCurrencies = CurrencyRegistry.getCurrenciesOfPlatform(platformCurrency.platform);
  const allSymbols = platformCurrencies.map(c => c.symbol);

  const { walletId, currency, records, amount } = await rawdb.findOneGroupOfCollectableDeposits(manager, allSymbols);

  if (!walletId || !currency || !records.length || amount.isZero()) {
    logger.info(`There're no uncollected deposit right now. Will try to process later...`);
    return;
  }

  const rallyWallet = await rawdb.findAnyInternalHotWallet(manager, walletId, currency.platform);
  if (!rallyWallet) {
    throw new Error(`Hot wallet for symbol=${currency.platform} not found`);
  }
  let rawTx: IRawTransaction;
  try {
    // check balance in network to prevent misseeding error
    if (!currency.isNative) {
      const gateway = await GatewayRegistry.getGatewayInstance(currency.platform);
      let minAmount;
      const walletBalance = await rawdb.findWalletBalance(manager, currency.platform, walletId);
      if (walletBalance && walletBalance.minimumCollectAmount) {
        minAmount = new BigNumber(walletBalance.minimumCollectAmount);
      } else {
        minAmount = (await gateway.getAverageSeedingFee()).multipliedBy(new BigNumber(3));
      }
      if (records.length > 1) {
        throw new Error('multiple tx seeding is not supported now');
      }
      const record = records[0];
      const balance = await gateway.getAddressBalance(record.toAddress);
      if (balance.gte(minAmount)) {
        logger.warn(`deposit id=${record.id} is pending, if it last for long, collect manually`);
        manager.update(Deposit, record.id, {
          updatedAt: Utils.nowInMillis() + 3 * 60 * 1000, // 3 minutes
        });
        return;
      }
    }

    rawTx = currency.isUTXOBased
      ? await _constructUtxoBasedCollectTx(records, rallyWallet.address)
      : await _constructAccountBasedCollectTx(records, rallyWallet.address);
  } catch (err) {
    logger.warn(`Cannot create raw transaction, may need fee seeder err=${err}`);
    await rawdb.updateRecordsTimestamp(manager, Deposit, records.map(r => r.id));
    if (!currency.isNative) {
      const record = records[0];
      record.collectStatus = CollectStatus.SEED_REQUESTED;
      await manager.save(record);
    }
    return;
  }
  if (!rawTx) {
    throw new Error('rawTx is undefined because of unknown problem');
  }

  const signedTx = await _collectorSignDoProcess(manager, currency, records, rawTx);
  try {
    await _collectorSubmitDoProcess(manager, currency, walletId, signedTx, rallyWallet.address, amount);
  } catch (e) {
    await manager.update(Deposit, records.map(r => r.id), {
      updatedAt: Utils.nowInMillis(),
      collectedTxid: 'SUBMIT_FAILED_CHECK_ME_PLEASE',
      collectStatus: CollectStatus.NOTCOLLECT,
    });
    throw e;
  }

  const now = Utils.nowInMillis();
  await manager.update(Deposit, records.map(r => r.id), {
    updatedAt: now,
    collectedTxid: signedTx.txid,
    collectStatus: CollectStatus.COLLECTING,
  });

  logger.info(`Collect tx sent: address=${rallyWallet.address}, txid=${signedTx.txid}`);
}

async function _constructUtxoBasedCollectTx(deposits: Deposit[], toAddress: string): Promise<IRawTransaction> {
  const currency = CurrencyRegistry.getOneCurrency(deposits[0].currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency) as BitcoinBasedGateway;
  const utxos: IInsightUtxoInfo[] = [];
  const weirdVouts: IBoiledVOut[] = [];
  const depositAddresses: string[] = [];

  await Utils.PromiseAll(
    deposits.map(async deposit => {
      const depositAddress = deposit.toAddress;
      const txid = deposit.txid;
      if (depositAddresses.indexOf(depositAddress) === -1) {
        depositAddresses.push(depositAddress);
      }

      const depositVouts = await gateway.getOneTxVouts(deposit.txid, depositAddress);
      const allAddressUtxos = await gateway.getOneAddressUtxos(depositAddress);
      depositVouts.forEach(vout => {
        // Something went wrong. This output has been spent.
        if (vout.spentTxId) {
          weirdVouts.push(vout);
          return;
        }

        const utxo = allAddressUtxos.find(u => {
          return u.txid === txid && u.address === depositAddress && u.vout === vout.n;
        });

        // Double check. Something went wrong here as well. The output has been spent.
        if (!utxo) {
          logger.error(`Output has been spent already: address=${depositAddress}, txid=${txid}, n=${vout.n}`);
          return;
        }

        utxos.push(utxo);
      });
    })
  );

  // Safety check, just in case
  if (weirdVouts.length > 0) {
    throw new Error(`Weird outputs were spent without collecting: ${JSON.stringify(weirdVouts)}`);
  }

  // Final check. Guarding one more time, whether total value from utxos is equal to deposits' value
  const depositAmount = deposits.reduce((memo, d) => memo.plus(new BigNumber(d.amount)), new BigNumber(0));
  const utxoAmount = utxos.reduce((memo, u) => memo.plus(new BigNumber(u.satoshis)), new BigNumber(0));

  if (!depositAmount.eq(utxoAmount)) {
    throw new Error(`Mismatch collecting values: depositAmount=${depositAmount}, utxoAmount=${utxoAmount}`);
  }

  return gateway.constructRawConsolidateTransaction(utxos, toAddress);
}

async function _constructAccountBasedCollectTx(deposits: Deposit[], toAddress: string): Promise<IRawTransaction> {
  const currency = CurrencyRegistry.getOneCurrency(deposits[0].currency);
  const gateway = GatewayRegistry.getGatewayInstance(currency) as AccountBasedGateway;
  const amount = deposits.reduce((memo, deposit) => {
    return memo.plus(new BigNumber(deposit.amount));
  }, new BigNumber(0));

  const opts = { isConsolidate: currency.isNative, useLowerNetworkFee: true };
  return gateway.constructRawTransaction(deposits[0].toAddress, toAddress, amount, opts);
}

async function _collectorSignDoProcess(
  manager: EntityManager,
  currency: ICurrency,
  deposits: Deposit[],
  rawTx: IRawTransaction
): Promise<ISignedRawTransaction> {
  const gateway = GatewayRegistry.getGatewayInstance(currency);
  let secrets = await Promise.all(
    deposits.map(async deposit => {
      const address = await manager.findOne(Address, {
        address: deposit.toAddress,
      });
      if (!address) {
        throw new Error(`${deposit.toAddress} is not in database`);
      }
      return await address.extractRawPrivateKey();
    })
  );

  secrets = _.uniq(secrets);

  if (currency.isUTXOBased) {
    return gateway.signRawTransaction(rawTx.unsignedRaw, secrets);
  }

  if (secrets.length > 1) {
    throw new Error('Account-base tx is only use one secret');
  }

  return gateway.signRawTransaction(rawTx.unsignedRaw, secrets[0]);
}

async function _collectorSubmitDoProcess(
  manager: EntityManager,
  currency: ICurrency,
  walletId: number,
  signedTx: ISignedRawTransaction,
  toAddress: string,
  amount: BigNumber
): Promise<void> {
  const gateway = GatewayRegistry.getGatewayInstance(currency);

  try {
    await gateway.sendRawTransaction(signedTx.signedRaw);
  } catch (e) {
    logger.error(`Can not send transaction txid=${signedTx.txid}`);
    throw e;
  }

  const internalTransferRecord = new InternalTransfer();
  internalTransferRecord.currency = currency.symbol;
  internalTransferRecord.txid = signedTx.txid;
  internalTransferRecord.walletId = walletId;
  internalTransferRecord.type = InternalTransferType.COLLECT;
  internalTransferRecord.status = WithdrawalStatus.SENT;
  internalTransferRecord.fromAddress = 'will remove this field';
  internalTransferRecord.toAddress = toAddress;
  internalTransferRecord.amount = amount.toString();

  await Utils.PromiseAll([manager.save(internalTransferRecord)]);
  return;
}
