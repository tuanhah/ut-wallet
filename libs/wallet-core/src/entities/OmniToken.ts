import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('omni_token')
export class OmniToken {
  @PrimaryColumn({ name: 'symbol', nullable: false })
  public symbol: string;

  @Column({ name: 'name', nullable: false })
  public name: string;

  @Column({ name: 'property_id', nullable: false })
  public propertyId: number;

  @Column({ name: 'scale', nullable: false })
  public scale: number;

  @Column({ name: 'network', nullable: false })
  public network: string;
}
