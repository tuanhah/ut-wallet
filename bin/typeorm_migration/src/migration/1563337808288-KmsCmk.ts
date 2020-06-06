import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class KmsCmk1563337808288 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: process.env.TYPEORM_PREFIX + 'kms_cmk',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
          },
          {
            name: 'region',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'alias',
            type: 'varchar',
            length: '255',
            default: '""',
          },
          {
            name: 'arn',
            type: 'varchar',
            isNullable: false,
            length: '255',
          },
          {
            name: 'is_enabled',
            type: 'int',
            isNullable: false,
            default: 0,
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
      process.env.TYPEORM_PREFIX + 'kms_cmk',
      new TableIndex({
        name: 'kms_cmk_id',
        columnNames: ['id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex(process.env.TYPEORM_PREFIX + 'kms_cmk', 'kms_cmk_id');
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'kms_cmk');
  }
}
