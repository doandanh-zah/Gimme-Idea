import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsObject()
  executionPayload?: {
    recipientWallet?: string;
    amountUsdc?: number;
    note?: string;
  };
}
