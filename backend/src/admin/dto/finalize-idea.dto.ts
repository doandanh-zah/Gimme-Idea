import { IsIn, IsOptional, IsString, MinLength } from "class-validator";

export class FinalizeIdeaDto {
  @IsString()
  @IsIn(["pass", "reject"])
  decision: "pass" | "reject";

  @IsString()
  @MinLength(20)
  onchainTx: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  proposalPubkey?: string;
}
