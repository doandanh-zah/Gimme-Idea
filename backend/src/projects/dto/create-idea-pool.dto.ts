import { IsBoolean, IsObject, IsOptional, IsString, MinLength } from "class-validator";

export class CreateIdeaPoolDto {
  @IsString()
  @MinLength(20)
  daoAddress: string;

  @IsString()
  @MinLength(20)
  proposalPubkey: string;

  @IsString()
  @MinLength(20)
  passPoolAddress: string;

  @IsString()
  @MinLength(20)
  failPoolAddress: string;

  @IsString()
  @MinLength(20)
  poolCreateTx: string;

  @IsOptional()
  @IsBoolean()
  sponsor?: boolean;

  @IsOptional()
  @IsObject()
  onchainRefs?: Record<string, any>;
}
