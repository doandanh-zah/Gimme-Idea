import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemAiPackDto {
  @IsString()
  @IsNotEmpty()
  txHash: string;
}
