import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

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

  @IsString()
  @IsOptional()
  website?: string;

  @IsNumber()
  @IsOptional()
  bounty?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  // Idea-specific fields
  @IsString()
  @IsOptional()
  problem?: string;

  @IsString()
  @IsOptional()
  solution?: string;

  @IsString()
  @IsOptional()
  opportunity?: string;

  @IsString()
  @IsOptional()
  goMarket?: string;

  @IsString()
  @IsOptional()
  teamInfo?: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}
