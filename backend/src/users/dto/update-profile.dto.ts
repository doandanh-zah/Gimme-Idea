import { IsString, IsOptional, IsObject } from "class-validator";

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsObject()
  @IsOptional()
  socialLinks?: {
    twitter?: string;
    github?: string;
    website?: string;
  };
}
