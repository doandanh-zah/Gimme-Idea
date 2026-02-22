import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AgentRotateKeyDto {
  @IsString()
  currentSecretKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  newKeyName?: string;
}
