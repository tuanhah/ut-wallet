import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class WebhookLog1557195005003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: process.env.TYPEORM_PREFIX + 'webhook_log',
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
            name: 'webhook_progress_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'url',
            type: 'varchar',
            isNullable: false,
            length: '255',
          },
          {
            name: 'params',
            type: 'text',
          },
          {
            name: 'status',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'msg',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'bigint',
          },
        ],
      }),
      true
    );
    await queryRunner.createIndex(
      process.env.TYPEORM_PREFIX + 'webhook_log',
      new TableIndex({
        name: 'webhook_log_webhook_progress_id',
        columnNames: ['webhook_progress_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex(process.env.TYPEORM_PREFIX + 'webhook_log', 'webhook_log_webhook_progress_id');
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'webhook_log');
  }
}
