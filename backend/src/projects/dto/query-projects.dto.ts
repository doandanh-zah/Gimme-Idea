import { IsString, IsEnum, IsOptional, IsInt, Min } from "class-validator";
import { Transform } from "class-transformer";

export class QueryProjectsDto {
  @IsEnum(["project", "idea"])
  @IsOptional()
  type?: "project" | "idea";

  @IsEnum([
    "DeFi",
    "NFT",
    "Gaming",
    "Infrastructure",
    "DAO",
    "DePIN",
    "Social",
    "Mobile",
    "Security",
    "Payment",
    "Developer Tooling",
    "ReFi",
    "Content",
    "Dapp",
    "Blinks",
  ])
  @IsOptional()
  category?:
    | "DeFi"
    | "NFT"
    | "Gaming"
    | "Infrastructure"
    | "DAO"
    | "DePIN"
    | "Social"
    | "Mobile"
    | "Security"
    | "Payment"
    | "Developer Tooling"
    | "ReFi"
    | "Content"
    | "Dapp"
    | "Blinks";

  @IsEnum(["Idea", "Prototype", "Devnet", "Mainnet"])
  @IsOptional()
  stage?: "Idea" | "Prototype" | "Devnet" | "Mainnet";

  @IsString()
  @IsOptional()
  search?: string;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number = 0;

  @IsEnum(["votes", "createdAt", "feedbackCount"])
  @IsOptional()
  sortBy?: "votes" | "createdAt" | "feedbackCount" = "createdAt";

  @IsEnum(["asc", "desc"])
  @IsOptional()
  sortOrder?: "asc" | "desc" = "desc";

  @IsOptional()
  @IsString()
  poolStatus?:
    | "none"
    | "draft"
    | "reviewing"
    | "approved_for_pool"
    | "pool_open"
    | "active"
    | "finalized"
    | "rejected"
    | string;
}
