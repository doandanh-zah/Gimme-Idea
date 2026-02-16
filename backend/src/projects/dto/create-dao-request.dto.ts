import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDaoRequestDto {
  @IsString()
  @MinLength(20)
  txSignature: string;

  @IsOptional()
  @IsString()
  note?: string;
}
