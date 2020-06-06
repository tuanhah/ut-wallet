import BigNumber from 'bignumber.js';

/**
 * Simple VIn and VOut are formats that are used in constructing transaction
 */
export interface IRawVIn {
  readonly fromAddress: string;
  readonly amount: BigNumber;
}

export interface IRawVOut {
  readonly toAddress: string;
  readonly amount: BigNumber;
}

/**
 * Boilded VIn and VOut are formats that are returned from APIs of a full node.
 * They're a part of a processed transaction, which has ben recorded on the network already
 * We'll just care and extract the coin transferring portion, other information
 * don't need to be exposed here...
 */
export interface IBoiledVIn {
  readonly addr: string;
  readonly txid: string;
  readonly vout: number;
  readonly scriptSig: {
    readonly asm: string;
    readonly hex: string;
  };
  readonly value: number;
  readonly sequence: number;
}

export interface IBoiledVOut {
  readonly value: number;
  readonly n: number;
  readonly scriptPubKey: {
    readonly asm: string;
    readonly hex: string;
    readonly reqSigs?: number;
    readonly type: string;
    readonly addresses?: string[];
  };
  readonly spentTxId?: string;
  readonly spentIndex?: number;
  readonly spentHeight?: number;
}

/**
 * This is usually the response when calling JSON-RPC API `getrawtransaction`
 * Also the response format that is return from APIs
 * + Get tx details information: `/tx/:txid`
 * + Get txs in a block: `/txs?block={blockNumber}&pageNum={pageNumber}`
 * Each format has some own additional fields, but we just pick the common ones to this interface
 */
export interface IUtxoTxInfo {
  readonly txid: string;
  confirmations: number;
  readonly vin: IBoiledVIn[];
  readonly vout: IBoiledVOut[];
  readonly size: number;
  readonly version: number;
  readonly time: number;
  readonly locktime: number;
  readonly blockhash: string;
  readonly blocktime: number;
}

/**
 * This is usually the response when calling JSON-RPC API `getblock`
 */
export interface IUtxoBlockInfo {
  readonly hash: string;
  readonly confirmations: number;
  readonly size: number;
  readonly height: number;
  readonly version: number;
  readonly versionHex: number;
  readonly merkleroot: string;
  readonly time: number;
  readonly mediantime: number;
  readonly nonce: number;
  readonly bits: string;
  readonly difficulty: number;
  readonly previousblockhash: string;
  readonly nextblockhash?: string;
  readonly tx: string[];
  readonly strippedsize: number;
  readonly chainwork: string;
  readonly weight: number;
}

// Response format that is returned from API `/addr/:addr/?noTxList=1`
export interface IInsightAddressInfo {
  readonly addrStr: string;
  readonly balance: number;
  readonly balanceSat: number;
  readonly totalReceived: number;
  readonly totalReceivedSat: number;
  readonly totalSent: number;
  readonly totalSentSat: number;
  readonly unconfirmedBalance: number;
  readonly unconfirmedBalanceSat: number;
  readonly unconfirmedTxApperances: number;
  readonly txApperances: number;
}

// Response format that is return from API `/addr/:addr/utxo`
export interface IInsightUtxoInfo {
  readonly address: string;
  readonly txid: string;
  readonly vout: number;
  readonly scriptPubKey: string;
  readonly amount: number;
  readonly satoshis: number;
  readonly height: number;
  readonly confirmations: number;
  // For Omni protocol
  value?: number;
}

// Response format that is return from API `/txs?block={blockNumber}&pageNum={pageNumber}`
export interface IInsightTxsInfo {
  pagesTotal: number;
  txs: IUtxoTxInfo[];
}

// Format of utxo that is used by bitcore-lib as inputs of transaction
export interface IBitcoreUtxoInput {
  readonly address: string;
  readonly txId: string;
  readonly outputIndex: number;
  readonly script: string;
  readonly satoshis: number;
}
