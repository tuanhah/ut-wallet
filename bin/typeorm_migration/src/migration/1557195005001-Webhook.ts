import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class Webhook1557195005001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: process.env.TYPEORM_PREFIX + 'webhook',
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
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
            length: '20',
          },
          {
            name: 'url',
            type: 'varchar',
            isNullable: false,
            length: '255',
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
    const table_name = process.env.TYPEORM_PREFIX + 'webhook';
    await queryRunner.query(
      `INSERT INTO ${table_name} ` +
        '(`id`, `user_id`, `type`, `url`, `created_at`, `updated_at`)' +
        ' VALUES ' +
        `('1', '1', 'common', 'http://amanpuri2-api-external.sotatek.com/api/v1/webhook/sotatek', 1557636432024, 1557636432024)`
    );
    await queryRunner.query(`ALTER TABLE ` + table_name + ` ALTER type SET DEFAULT "common"`);
    await queryRunner.createIndex(
      process.env.TYPEORM_PREFIX + 'webhook',
      new TableIndex({
        name: 'webhook_user_id',
        columnNames: ['user_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex(process.env.TYPEORM_PREFIX + 'webhook', 'webhook_user_id');
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'webhook');
  }
}
