import {
    IsString,
    IsOptional,
    IsUUID,
    MaxLength,
} from "class-validator";

export class RegisterHackathonDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    teamName?: string;
}

export class QueryRegistrationsDto {
    @IsOptional()
    @IsString()
    hackathonId?: string; // Can be UUID or slug

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    limit?: number = 50;

    @IsOptional()
    offset?: number = 0;
}

export interface HackathonRegistration {
    id: string;
    hackathonId: string;
    userId: string;
    teamName?: string;
    registeredAt: string;
    // Populated fields
    user?: {
        id: string;
        username: string;
        avatar?: string;
    };
}
