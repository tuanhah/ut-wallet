import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class MasterPrivateKey1557193001001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: process.env.TYPEORM_PREFIX + 'master_private_key',
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
            name: 'currency',
            type: 'varchar',
            isNullable: false,
            length: '10',
          },
          {
            name: 'wallet_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'encrypted',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'password_hash',
            type: 'text',
            isNullable: false,
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
      process.env.TYPEORM_PREFIX + 'master_private_key',
      new TableIndex({
        name: 'wallet_master_private_key_currency',
        columnNames: ['currency'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex(
      process.env.TYPEORM_PREFIX + 'master_private_key',
      'wallet_master_private_key_currency'
    );
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'master_private_key');
  }
}
