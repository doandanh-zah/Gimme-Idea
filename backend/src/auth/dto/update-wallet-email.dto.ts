import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateWalletEmailDto {
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;
}
