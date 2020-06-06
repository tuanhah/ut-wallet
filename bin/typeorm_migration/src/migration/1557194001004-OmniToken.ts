import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class OmniToken1557194001004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const tableName = process.env.TYPEORM_PREFIX + 'omni_token';
    await queryRunner.createTable(
      new Table({
        name: tableName,
        columns: [
          {
            name: 'symbol',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'property_id',
            type: 'int',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'scale',
            type: 'int',
            default: 0,
          },
          {
            name: 'network',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'created_at',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'updated_at',
            type: 'bigint',
            isNullable: true,
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    const tableName = process.env.TYPEORM_PREFIX + 'omni_token';
    await queryRunner.dropTable(tableName);
  }
}
