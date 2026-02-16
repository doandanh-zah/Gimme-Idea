import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePoolSupportDto {
  @IsString()
  projectId: string;

  @IsString()
  txHash: string;

  @IsNumber()
  @Min(0)
  amountUsdc: number;

  @IsNumber()
  @Min(0)
  feeUsdc: number;

  @IsString()
  treasuryWallet: string;

  @IsOptional()
  @IsString()
  supporterWallet?: string;
}
