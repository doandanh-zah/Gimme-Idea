import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStripeCheckoutDto {
  @IsString()
  @IsIn(['pack', 'pro5', 'pro10'])
  plan: 'pack' | 'pro5' | 'pro10';

  @IsString()
  @IsNotEmpty()
  payerName: string;

  @IsEmail()
  payerEmail: string;

  @IsOptional()
  @IsString()
  country?: string;
}
