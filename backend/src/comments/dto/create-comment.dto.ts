import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsOptional()
  parentCommentId?: string;

  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean = false;
}
