import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class WalletBalance1557195002002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const tableName = process.env.TYPEORM_PREFIX + 'wallet_balance';
    await queryRunner.createTable(
      new Table({
        name: process.env.TYPEORM_PREFIX + 'wallet_balance',
        columns: [
          {
            name: 'id',
            type: 'bigint',
            unsigned: true,
            isGenerated: true,
            generationStrategy: 'increment',
            isPrimary: true,
          },
          {
            name: 'wallet_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'balance',
            type: 'decimal',
            unsigned: true,
            precision: 40,
            scale: 8,
            default: 0,
          },
          {
            name: 'withdrawal_pending',
            type: 'decimal',
            unsigned: true,
            precision: 50,
            scale: 18,
            default: 0,
          },
          {
            name: 'withdrawal_total',
            type: 'decimal',
            unsigned: true,
            precision: 40,
            scale: 8,
            default: 0,
          },
          {
            name: 'deposit_total',
            type: 'decimal',
            unsigned: true,
            precision: 40,
            scale: 8,
            default: 0,
          },
          {
            name: 'upper_threshold',
            type: 'decimal',
            unsigned: true,
            precision: 40,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'lower_threshold',
            type: 'decimal',
            unsigned: true,
            precision: 40,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'middle_threshold',
            type: 'decimal',
            unsigned: true,
            precision: 40,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'minimum_collect_amount',
            type: 'decimal',
            unsigned: true,
            precision: 40,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'bigint',
          },
          {
            name: 'updated_at',
            type: 'bigint',
          },
        ],
      }),
      true
    );
    await queryRunner.createIndex(
      process.env.TYPEORM_PREFIX + 'wallet_balance',
      new TableIndex({
        name: 'wallet_balance_wallet_id',
        columnNames: ['wallet_id'],
      })
    );
    await queryRunner.query(`ALTER TABLE ` + tableName + ` ADD CONSTRAINT wallet_id_coin UNIQUE (wallet_id, currency)`);
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`, `minimum_collect_amount`)' +
        ' VALUES ' +
        `('1001', 'btc', 1557636432024, 1557636432024, 85000)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1001', 'omni.2', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1002', 'eos', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1002', 'eos.EOS', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1006', 'erc20.0xBFd78659212F00dE65A6411DAdC75878930725Ec', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`, `minimum_collect_amount`)' +
        ' VALUES ' +
        `('1006', 'eth', 1557636432024, 1557636432024, 30269660000000000)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1003', 'ada', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1004', 'xrp', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1005', 'ltc', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(
      `INSERT INTO ${tableName} ` +
        '(`wallet_id`, `currency`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1007', 'bch', 1557636432024, 1557636432024)`
    );
  }
  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'wallet_balance');
  }
}
