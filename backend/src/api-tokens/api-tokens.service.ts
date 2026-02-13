import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { SupabaseService } from '../shared/supabase.service';

export type TokenScope =
  | 'post:read'
  | 'post:write'
  | 'comment:write'
  | 'comment:reply';

export type ApiTokenAuth = {
  userId: string;
  tokenId: string;
  scopes: TokenScope[];
};

@Injectable()
export class ApiTokensService {
  constructor(private supabaseService: SupabaseService) {}

  private sha256(input: string) {
    return createHash('sha256').update(input).digest('hex');
  }

  createPlainToken() {
    const raw = randomBytes(32).toString('hex');
    return `gi_pat_${raw}`;
  }

  async createToken(params: { userId: string; name: string; scopes: TokenScope[]; expiresAt?: string | null }) {
    const supabase = this.supabaseService.getAdminClient();

    const plain = this.createPlainToken();
    const tokenHash = this.sha256(plain);

    const { data, error } = await supabase
      .from('api_tokens')
      .insert({
        user_id: params.userId,
        name: params.name,
        token_hash: tokenHash,
        scopes: params.scopes,
        expires_at: params.expiresAt || null,
      })
      .select('id, user_id, name, scopes, created_at, expires_at')
      .single();

    if (error) throw new Error(`Failed to create token: ${error.message}`);

    return {
      token: plain, // show once
      tokenMeta: data,
    };
  }

  async listTokens(userId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('api_tokens')
      .select('id, name, scopes, last_used_at, expires_at, revoked_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list tokens: ${error.message}`);
    return data;
  }

  async revokeToken(userId: string, tokenId: string) {
    const supabase = this.supabaseService.getAdminClient();

    const { data: token, error: findError } = await supabase
      .from('api_tokens')
      .select('id, user_id')
      .eq('id', tokenId)
      .single();

    if (findError || !token) throw new ForbiddenException('Token not found');
    if (token.user_id !== userId) throw new ForbiddenException('Not your token');

    const { error } = await supabase
      .from('api_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenId);

    if (error) throw new Error(`Failed to revoke token: ${error.message}`);
    return { revoked: true };
  }

  async authenticateFromHeaderToken(bearer: string): Promise<ApiTokenAuth> {
    if (!bearer?.startsWith('gi_pat_')) {
      throw new UnauthorizedException('Not a PAT token');
    }

    const tokenHash = this.sha256(bearer);
    const supabase = this.supabaseService.getAdminClient();

    // Find active token
    const { data: token, error } = await supabase
      .from('api_tokens')
      .select('id, user_id, scopes, revoked_at, expires_at')
      .eq('token_hash', tokenHash)
      .single();

    if (error || !token) throw new UnauthorizedException('Invalid token');
    if (token.revoked_at) throw new UnauthorizedException('Token revoked');
    if (token.expires_at && new Date(token.expires_at).getTime() < Date.now()) {
      throw new UnauthorizedException('Token expired');
    }

    // Best-effort constant-time compare on hash (avoid trivial timing leakage)
    const a = Buffer.from(tokenHash);
    const b = Buffer.from(this.sha256(bearer));
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid token');
    }

    // Update last_used_at asynchronously (don’t block)
    supabase
      .from('api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', token.id)
      .then(() => null);

    return {
      userId: token.user_id,
      tokenId: token.id,
      scopes: (token.scopes || []) as TokenScope[],
    };
  }

  ensureScope(scopes: TokenScope[], needed: TokenScope) {
    if (!scopes.includes(needed)) {
      throw new ForbiddenException(`Missing scope: ${needed}`);
    }
  }

  async audit(params: {
    actorUserId?: string | null;
    tokenId?: string | null;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: any;
    ip?: string;
    userAgent?: string;
  }) {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase.from('audit_logs').insert({
      actor_user_id: params.actorUserId || null,
      token_id: params.tokenId || null,
      action: params.action,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
      metadata: params.metadata || {},
      ip: params.ip || null,
      user_agent: params.userAgent || null,
    });

    if (error) {
      // do not throw hard on audit to avoid breaking main flow
      return;
    }
  }
}
