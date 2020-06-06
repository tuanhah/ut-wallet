import { BlockHeader, BigNumber, AccountBasedTransaction, BlockchainPlatform, CurrencyRegistry } from 'sota-common';
import { web3 } from './web3';
import * as web3_types from 'web3/types';
import * as eth_types from 'web3/eth/types';

export class EthTransaction extends AccountBasedTransaction {
  public readonly receiptStatus: boolean;
  public readonly block: BlockHeader;
  public readonly receipt: web3_types.TransactionReceipt;
  public readonly originalTx: eth_types.Transaction;

  constructor(
    tx: eth_types.Transaction,
    block: BlockHeader,
    receipt: web3_types.TransactionReceipt,
    lastNetworkBlockNumber: number
  ) {
    const currency = CurrencyRegistry.getOneNativeCurrency(BlockchainPlatform.Ethereum);
    const txProps = {
      confirmations: lastNetworkBlockNumber - tx.blockNumber + 1,
      height: tx.blockNumber,
      timestamp: block.timestamp,
      txid: tx.hash,
      fromAddress: tx.from,
      toAddress: tx.to,
      amount: new BigNumber(tx.value),
    };

    super(currency, txProps, block);

    this.receiptStatus = receipt.status;
    this.block = block;
    this.receipt = receipt;
    this.originalTx = tx;
    this.isFailed = !this.receiptStatus;
  }

  public getExtraDepositData(): any {
    return Object.assign({}, super.getExtraDepositData(), {
      txIndex: this.receipt.transactionIndex,
    });
  }

  public getNetworkFee(): BigNumber {
    const gasUsed = web3.utils.toBN(this.receipt.gasUsed);
    const gasPrice = web3.utils.toBN(this.originalTx.gasPrice);
    return new BigNumber(gasPrice.mul(gasUsed).toString());
  }
}

export default EthTransaction;
