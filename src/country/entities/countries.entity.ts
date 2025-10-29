import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Country {
  @PrimaryColumn({
    unique: true,
  })
  name: string;

  @Column({
    nullable: true,
  })
  capital?: string;

  @Column({
    nullable: true,
  })
  region?: string;

  @Column({
    nullable: true,
  })
  population: number;

  @Column({
    nullable: true,
  })
  currency_code?: string;

  @Column({
    nullable: true,
    type: 'numeric',
  })
  exchange_rate: number;

  @Column({
    type: 'numeric',
    nullable: true,
  })
  estimated_gdp: number;

  @Column({
    nullable: true,
  })
  flag_url?: string;

  @Column()
  last_refreshed_at: Date;
}
