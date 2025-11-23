import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @IsEnum(['tip', 'bounty', 'reward'])
  type: 'tip' | 'bounty' | 'reward';

  @IsNumber()
  amount: number;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  commentId?: string;

  @IsString()
  @IsNotEmpty()
  recipientWallet: string;
}
