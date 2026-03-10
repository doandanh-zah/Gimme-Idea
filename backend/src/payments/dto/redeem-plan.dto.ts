import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class RedeemPlanDto {
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @IsString()
  @IsIn(['pro5', 'pro10'])
  planTier: 'pro5' | 'pro10';
}
