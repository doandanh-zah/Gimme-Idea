import { SetMetadata } from "@nestjs/common";
import { TokenScope } from "../../api-tokens/api-tokens.service";

export const REQUIRED_PAT_SCOPES_KEY = "requiredPatScopes";

export const RequirePatScope = (...scopes: TokenScope[]) =>
  SetMetadata(REQUIRED_PAT_SCOPES_KEY, scopes);
