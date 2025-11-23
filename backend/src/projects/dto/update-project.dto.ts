import { IsString, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO'])
  @IsOptional()
  category?: 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure' | 'DAO';

  @IsEnum(['Idea', 'Prototype', 'Devnet', 'Mainnet'])
  @IsOptional()
  stage?: 'Idea' | 'Prototype' | 'Devnet' | 'Mainnet';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsNumber()
  @IsOptional()
  bounty?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
