import { Utils } from 'sota-common';
import { Entity, Column, PrimaryColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('cold_wallet')
export class ColdWallet {
  @Column('int', { name: 'user_id', nullable: false })
  public userId: number;

  @Column('int', { name: 'wallet_id', nullable: false })
  public walletId: number;

  @Column({ name: 'address', nullable: false })
  public address: string;

  @PrimaryColumn({ name: 'currency', nullable: false })
  public currency: string;

  @Column({ name: 'type' })
  public type: string;

  @Column({ name: 'created_at', type: 'bigint' })
  public createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint' })
  public updatedAt: number;

  @BeforeInsert()
  public updateCreateDates() {
    this.createdAt = Utils.nowInMillis();
    this.updatedAt = Utils.nowInMillis();
  }

  @BeforeUpdate()
  public updateUpdateDates() {
    this.updatedAt = Utils.nowInMillis();
  }
}
