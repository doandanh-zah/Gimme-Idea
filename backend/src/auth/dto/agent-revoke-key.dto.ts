import { IsString } from 'class-validator';

export class AgentRevokeKeyDto {
  @IsString()
  secretKey: string;
}
