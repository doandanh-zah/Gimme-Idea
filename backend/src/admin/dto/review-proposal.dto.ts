import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewProposalDto {
  @IsString()
  @IsIn(['pending', 'voting', 'passed', 'rejected', 'executed'])
  status: 'pending' | 'voting' | 'passed' | 'rejected' | 'executed';

  @IsOptional()
  @IsString()
  onchainTx?: string;
}
