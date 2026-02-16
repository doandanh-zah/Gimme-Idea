import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewDaoRequestDto {
  @IsString()
  @IsIn(['approved', 'rejected'])
  status: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  note?: string;
}
