import { IsString, IsOptional, IsBoolean, MaxLength, IsIn } from 'class-validator';

export class CreateFeedDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  @IsIn(['private', 'unlisted', 'public'])
  visibility?: 'private' | 'unlisted' | 'public';
}

export class UpdateFeedDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  @IsIn(['private', 'unlisted', 'public'])
  visibility?: 'private' | 'unlisted' | 'public';
}

export class AddFeedItemDto {
  @IsString()
  projectId: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
