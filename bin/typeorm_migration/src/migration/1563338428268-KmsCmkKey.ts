import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class KmsCmkKey1563338428268 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: process.env.TYPEORM_PREFIX + 'kms_data_key',
        columns: [
          {
            name: 'id',
            type: 'int',
            unsigned: true,
            isGenerated: true,
            generationStrategy: 'increment',
            isPrimary: true,
          },
          {
            name: 'cmk_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'encrypted_data_key',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          {
            name: 'is_enabled',
            type: 'int',
            isNullable: false,
            default: '1',
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
      process.env.TYPEORM_PREFIX + 'kms_data_key',
      new TableIndex({
        name: 'kms_data_key_cmk_id',
        columnNames: ['cmk_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex(process.env.TYPEORM_PREFIX + 'kms_data_key', 'kms_data_key_cmk_id');
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'kms_data_key');
  }
}
