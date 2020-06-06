import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Erc20Token1561013465144 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    const table = process.env.TYPEORM_PREFIX + 'erc20_token';
    await queryRunner.createTable(
      new Table({
        name: table,
        columns: [
          {
            name: 'symbol',
            type: 'varchar',
            isNullable: false,
            length: '100',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
            length: '100',
            isUnique: true,
          },
          {
            name: 'contract_address',
            type: 'varchar',
            isNullable: false,
            isPrimary: true,
          },
          {
            name: 'decimal',
            type: 'tinyint',
            isNullable: false,
            unsigned: true,
          },
          {
            name: 'total_supply',
            type: 'decimal',
            isNullable: true,
            default: 0,
            scale: 32,
          },
          {
            name: 'network',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
        ],
      }),
      true
    );
    await queryRunner.query(
      `INSERT INTO ${table} ` +
        '(`symbol`, `name`, `contract_address`, `decimal`, `total_supply`, `network`)' +
        ' VALUES ' +
        `('erc20.0xBFd78659212F00dE65A6411DAdC75878930725Ec', 'AMAL', '0xBFd78659212F00dE65A6411DAdC75878930725Ec', 8, 210000000, 'mainnet')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropTable(process.env.TYPEORM_PREFIX + 'erc20_token');
  }
}
