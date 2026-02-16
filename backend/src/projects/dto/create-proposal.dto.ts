import { IsString, MinLength } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;
}
