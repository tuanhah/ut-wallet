import * as EthTypes from 'web3/eth/types';

export function toBlockType(blockNumber: string | number): EthTypes.BlockType {
  if (typeof (blockNumber as any) === 'number') {
    return blockNumber as number;
  }

  switch (blockNumber) {
    case 'latest':
      return 'latest';
    case 'genesis':
      return 'genesis';
    case 'pending':
      return 'pending';

    default:
      throw new Error(`Invalid blockType value: ${blockNumber}`);
  }
}
