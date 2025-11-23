import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateProjectDto {
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

  @IsNumber()
  @IsOptional()
  bounty?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
