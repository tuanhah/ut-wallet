import { BlockHeader } from './BlockHeader';
import { Transaction } from './Transaction';
import { TransferEntry } from './TransferEntry';
import { implement } from '../Utils';
import { IBoiledVIn, IBoiledVOut, IUtxoTxInfo, ICurrency } from '../interfaces';
import BigNumber from 'bignumber.js';

export class UTXOBasedTransaction extends Transaction {
  public readonly vIns: IBoiledVIn[];
  public readonly vOuts: IBoiledVOut[];

  constructor(currency: ICurrency, tx: IUtxoTxInfo, block: BlockHeader) {
    // Construct tx props
    const txProps = {
      confirmations: tx.confirmations,
      height: block.number,
      timestamp: new Date(block.timestamp).getTime(),
      txid: tx.txid,
    };

    // Construct base transaction
    super(currency, txProps, block);

    // And vin/vout for utxo-based
    this.vIns = tx.vin;
    this.vOuts = tx.vout;
  }

  public getSatoshiFactor(): number {
    return 1e8;
  }

  @implement
  public _extractEntries(): TransferEntry[] {
    const entries: TransferEntry[] = [];

    // All in v Ins
    this.vIns.forEach(vIn => {
      const entry = this._convertVInToTransferEntry(vIn);
      if (entry) {
        entries.push(entry);
      }
    });

    // All in v Outs
    this.vOuts.forEach(vOut => {
      const entry = this._convertVOutToTransferEntry(vOut);
      if (entry) {
        entries.push(entry);
      }
    });

    return TransferEntry.mergeEntries(entries);
  }

  /**
   * Network fee is simple total input subtract total output
   */
  public getNetworkFee(): BigNumber {
    let result = new BigNumber(0);
    this.extractEntries().forEach(entry => {
      result = result.plus(entry.amount);
    });

    // We want to retreive the positive value
    return result.times(-1);
  }

  /**
   * Transform vIn to transfer entry
   *
   * @param vIn
   */
  protected _convertVInToTransferEntry(vIn: IBoiledVIn): TransferEntry {
    if (!vIn.addr) {
      return null;
    }

    return {
      amount: new BigNumber(-vIn.value * this.getSatoshiFactor()),
      currency: this.currency,
      address: vIn.addr,
      txid: this.txid,
      tx: this,
    };
  }

  /**
   * Transform vOut to transfer entry
   */
  protected _convertVOutToTransferEntry(vOut: IBoiledVOut): TransferEntry {
    const scriptPubKey = vOut.scriptPubKey;
    // If output is not a coin-transfer, just ignore it
    // We don't care about things other than coin transferring in this project
    if (!scriptPubKey.addresses || !scriptPubKey.addresses.length || !scriptPubKey.addresses[0]) {
      return null;
    }

    if (vOut.scriptPubKey.addresses.length > 1) {
      // Handle for multi-signature vout
      // case: vOut.scriptPubKey.addresses has greater than 1 element
      let multiSigAddress = 'MULTI_SIG';
      vOut.scriptPubKey.addresses.forEach(address => {
        multiSigAddress += '|' + address;
      });

      return {
        amount: new BigNumber(vOut.value * this.getSatoshiFactor()),
        currency: this.currency,
        address: multiSigAddress,
        tx: this,
        txid: this.txid,
      };
    }

    // Otherwise it's just a transfer to normal address
    // Handle for vout with single sig :) or unparsed address
    // case: vOut.scriptPubKey.addresses has 1 or 0 element
    // normal vout
    return {
      amount: new BigNumber(vOut.value * this.getSatoshiFactor()),
      currency: this.currency,
      address: vOut.scriptPubKey.addresses[0],
      txid: this.txid,
      tx: this,
    };
  }
}
