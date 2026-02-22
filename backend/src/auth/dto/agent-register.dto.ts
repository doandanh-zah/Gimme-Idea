import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AgentRegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_\-.]+$/)
  username: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  keyName?: string;
}
