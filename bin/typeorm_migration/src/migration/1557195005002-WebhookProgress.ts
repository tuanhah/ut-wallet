import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class WebhookProgress1557195005002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.createTable(
      new Table({
        name: process.env.TYPEORM_PREFIX + 'webhook_progress',
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
            name: 'webhook_id',
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
            name: 'ref_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'event',
            type: 'varchar',
            isNullable: false,
            length: '20',
          },
          {
            name: 'is_processed',
            type: 'tinyint',
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
      process.env.TYPEORM_PREFIX + 'webhook_progress',
      new TableIndex({
        name: 'webhook_progress_webhook_id',
        columnNames: ['webhook_id'],
      })
    );
    await queryRunner.createIndex(
      process.env.TYPEORM_PREFIX + 'webhook_progress',
      new TableIndex({
        name: 'webhook_progress_ref_id',
        columnNames: ['ref_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropIndex(process.env.TYPEORM_PREFIX + 'webhook_progress', 'webhook_progress_webhook_id');
    await queryRunner.dropIndex(process.env.TYPEORM_PREFIX + 'webhook_progress', 'webhook_progress_ref_id');
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'webhook_progress');
  }
}
