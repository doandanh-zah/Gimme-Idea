import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsNumber, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @IsEnum(['project', 'idea'])
  @IsOptional()
  type?: 'project' | 'idea' = 'project';

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['DeFi', 'NFT', 'Gaming', 'Infrastructure', 'DAO'])
  category: 'DeFi' | 'NFT' | 'Gaming' | 'Infrastructure' | 'DAO';

  @IsEnum(['Idea', 'Prototype', 'Devnet', 'Mainnet'])
  stage: 'Idea' | 'Prototype' | 'Devnet' | 'Mainnet';

  @IsArray()
  @IsString({ each: true })
  tags: string[];

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
  goMarket?: string; // Go-to-market strategy

  @IsString()
  @IsOptional()
  teamInfo?: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean = false;
}
