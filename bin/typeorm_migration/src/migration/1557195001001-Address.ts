import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class Address1557195001001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const tableName = process.env.TYPEORM_PREFIX + 'address';
    await queryRunner.createTable(
      new Table({
        name: process.env.TYPEORM_PREFIX + 'address',
        columns: [
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
            name: 'address',
            type: 'varchar',
            length: '190',
            isPrimary: true,
          },
          {
            name: 'is_external',
            type: 'tinyint',
          },
          {
            name: 'is_hd',
            type: 'tinyint',
          },
          {
            name: 'hd_path',
            type: 'varchar',
          },
          {
            name: 'secret',
            type: 'text',
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
      process.env.TYPEORM_PREFIX + 'address',
      new TableIndex({
        name: 'address_address',
        columnNames: ['address'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex(process.env.TYPEORM_PREFIX + 'address', 'address_address');
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'address');
  }
}
