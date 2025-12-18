import {
    IsString,
    IsOptional,
    IsUrl,
    IsUUID,
    IsEnum,
    MaxLength,
} from "class-validator";

export enum SubmissionStatus {
    DRAFT = "draft",
    SUBMITTED = "submitted",
    UNDER_REVIEW = "under_review",
    SHORTLISTED = "shortlisted",
    WINNER = "winner",
    REJECTED = "rejected",
}

export class CreateSubmissionDto {
    @IsUUID()
    hackathonId: string;

    @IsUUID()
    projectId: string;

    @IsOptional()
    @IsUrl()
    pitchVideoUrl?: string;

    @IsOptional()
    @IsUrl()
    pitchDeckUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

export class UpdateSubmissionDto {
    @IsOptional()
    @IsUrl()
    pitchVideoUrl?: string;

    @IsOptional()
    @IsUrl()
    pitchDeckUrl?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;

    @IsOptional()
    @IsEnum(SubmissionStatus)
    status?: SubmissionStatus;
}

export class QuerySubmissionsDto {
    @IsOptional()
    @IsUUID()
    hackathonId?: string;

    @IsOptional()
    @IsUUID()
    userId?: string;

    @IsOptional()
    @IsEnum(SubmissionStatus)
    status?: SubmissionStatus;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    sortBy?: "newest" | "votes" | "score";

    @IsOptional()
    limit?: number = 20;

    @IsOptional()
    offset?: number = 0;
}
