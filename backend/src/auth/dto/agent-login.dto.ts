import { IsString, MinLength } from 'class-validator';

export class AgentLoginDto {
  @IsString()
  @MinLength(20)
  secretKey: string;
}
