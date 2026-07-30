import { IsOptional, IsBoolean, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class GetNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean = false;
}

export class NotificationResponseDto {
  id: string;
  actorId: string | null;
  actorUsername: string | null;
  actorAvatar: string | null;
  type:
    | "follow"
    | "new_post"
    | "comment"
    | "comment_reply"
    | "like"
    | "mention";
  title: string;
  message: string;
  targetType: "project" | "comment" | "user" | null;
  targetId: string | null;
  read: boolean;
  createdAt: string;
}
