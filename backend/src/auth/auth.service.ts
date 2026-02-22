import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { SolanaService } from "../shared/solana.service";
import { SupabaseService } from "../shared/supabase.service";
import { LoginDto } from "./dto/login.dto";
import { EmailLoginDto } from "./dto/email-login.dto";
import { LinkWalletDto } from "./dto/link-wallet.dto";
import { UpdateWalletEmailDto } from "./dto/update-wallet-email.dto";
import { AgentRegisterDto } from './dto/agent-register.dto';
import { AgentLoginDto } from './dto/agent-login.dto';
import { AgentRotateKeyDto } from './dto/agent-rotate-key.dto';
import { AgentRevokeKeyDto } from './dto/agent-revoke-key.dto';
import { ApiResponse, User } from "../shared/types";

@Injectable()
export class AuthService {
  private readonly agentAttemptTracker = new Map<string, { count: number; firstAt: number }>();

  constructor(
    private solanaService: SolanaService,
    private supabaseService: SupabaseService,
    private configService: ConfigService
  ) {}

  private sha256(input: string) {
    return createHash('sha256').update(input).digest('hex');
  }

  private createAgentSecretKey() {
    return `gi_ask_${randomBytes(32).toString('hex')}`;
  }

  private createAgentWalletPlaceholder() {
    return `agent_${randomBytes(16).toString('hex')}`;
  }

  private getAgentKeyPrefix(secretKey: string) {
    return secretKey.slice(0, 18);
  }

  private assertAgentThrottle(prefix: string) {
    const now = Date.now();
    const winMs = 10 * 60 * 1000;
    const maxAttempts = 20;
    const current = this.agentAttemptTracker.get(prefix);

    if (!current || now - current.firstAt > winMs) {
      this.agentAttemptTracker.set(prefix, { count: 1, firstAt: now });
      return;
    }

    current.count += 1;
    if (current.count > maxAttempts) {
      throw new HttpException('Too many attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private issueJwt(user: any) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpires = this.configService.get<string>('JWT_EXPIRES_IN') || '365d';

    return jwt.sign(
      {
        userId: user.id,
        wallet: user.wallet,
        username: user.username,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: jwtExpires }
    );
  }

  private toUserResponse(user: any): User {
    return {
      id: user.id,
      wallet: user.wallet || '',
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider || 'wallet',
      authId: user.auth_id,
      needsWalletConnect: user.needs_wallet_connect || false,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };
  }

  private async audit(action: string, metadata: any = {}, actorUserId?: string) {
    const supabase = this.supabaseService.getAdminClient();
    await supabase.from('audit_logs').insert({
      action,
      actor_user_id: actorUserId || null,
      metadata,
    });
  }

  /**
   * Login with Solana wallet signature (SIWS - Sign In With Solana)
   */
  async login(
    loginDto: LoginDto
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    const { publicKey, signature, message } = loginDto;

    // 1. Verify Solana signature
    const isValid = this.solanaService.verifySignature(
      publicKey,
      signature,
      message
    );
    if (!isValid) {
      throw new UnauthorizedException("Invalid signature");
    }

    // 2. Check if user exists in database
    const supabase = this.supabaseService.getAdminClient();
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet", publicKey)
      .single();

    // 3. If user doesn't exist, create new user
    if (error || !user) {
      const newUser = {
        wallet: publicKey,
        username: `user_${publicKey.slice(0, 8)}`,
        reputation_score: 0,
        login_count: 1,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data: createdUser, error: createError } = await supabase
        .from("users")
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      user = createdUser;
    } else {
      // 3b. If user exists, update last login time and increment login count
      const { error: updateError } = await supabase.rpc(
        "increment_login_count",
        {
          user_id: user.id,
        }
      );

      if (updateError) {
        console.warn("Failed to update login info:", updateError.message);
        // Don't throw error, just log warning and continue
      }

      // Fetch updated user data
      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (updatedUser) {
        user = updatedUser;
      }
    }

    // 4. Generate JWT token
    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    const jwtExpires =
      this.configService.get<string>("JWT_EXPIRES_IN") || "365d"; // 1 year

    const token = jwt.sign(
      {
        userId: user.id,
        wallet: user.wallet,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: jwtExpires }
    );

    // 5. Map database user to User type
    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider || "wallet",
      authId: user.auth_id,
      needsWalletConnect: user.needs_wallet_connect || false,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: {
        token,
        user: userResponse,
      },
      message: "Login successful",
    };
  }

  /**
   * Login with Email (Google OAuth)
   */
  async loginWithEmail(
    emailLoginDto: EmailLoginDto
  ): Promise<ApiResponse<{ token: string; user: User; isNewUser: boolean }>> {
    const { email, authId, username } = emailLoginDto;

    const supabase = this.supabaseService.getAdminClient();

    // Use the database function to find or create user
    const { data: result, error: rpcError } = await supabase.rpc(
      "find_or_create_user_by_email",
      {
        p_email: email,
        p_auth_id: authId,
        p_username: username || null,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      throw new Error(`Failed to process email login: ${rpcError.message}`);
    }

    const { user_id, is_new_user, needs_wallet } = result[0];

    // Fetch full user data
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user_id)
      .single();

    if (fetchError || !user) {
      throw new Error("Failed to fetch user data");
    }

    // Update last login
    await supabase
      .from("users")
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (user.login_count || 0) + 1,
      })
      .eq("id", user_id);

    // Generate JWT token
    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    const jwtExpires =
      this.configService.get<string>("JWT_EXPIRES_IN") || "365d"; // 1 year

    const token = jwt.sign(
      {
        userId: user.id,
        wallet: user.wallet,
        username: user.username,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: jwtExpires }
    );

    const userResponse: User = {
      id: user.id,
      wallet: user.wallet || "",
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: new Date().toISOString(),
      loginCount: (user.login_count || 0) + 1,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider || "google",
      authId: user.auth_id,
      needsWalletConnect: needs_wallet,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: {
        token,
        user: userResponse,
        isNewUser: is_new_user,
      },
      message: is_new_user
        ? "Account created successfully"
        : "Login successful",
    };
  }

  async registerAgent(
    dto: AgentRegisterDto
  ): Promise<ApiResponse<{ token: string; user: User; secretKey: string }>> {
    const supabase = this.supabaseService.getAdminClient();
    const username = dto.username.trim();

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      throw new BadRequestException('Username already exists');
    }

    const nowIso = new Date().toISOString();
    const attemptPayloads: any[] = [
      // preferred modern schema
      { wallet: null, auth_provider: 'agent' },
      // fallback for auth_provider check without "agent"
      { wallet: null, auth_provider: 'wallet' },
      // fallback for legacy schema with wallet NOT NULL/UNIQUE
      { wallet: this.createAgentWalletPlaceholder(), auth_provider: 'agent' },
      { wallet: this.createAgentWalletPlaceholder(), auth_provider: 'wallet' },
      // last fallback if auth_provider column/check is problematic
      { wallet: this.createAgentWalletPlaceholder() },
    ];

    let user: any = null;
    let createUserError: any = null;
    for (const attempt of attemptPayloads) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          username,
          reputation_score: 0,
          login_count: 1,
          last_login_at: nowIso,
          created_at: nowIso,
          needs_wallet_connect: false,
          ...attempt,
        })
        .select('*')
        .single();

      if (!error && data) {
        user = data;
        createUserError = null;
        break;
      }

      createUserError = error;
    }

    if (!user) {
      const reason = createUserError?.message || 'unknown';
      console.error('[AuthService] registerAgent failed:', reason);
      throw new BadRequestException(`Agent register failed: ${reason}`);
    }

    const secretKey = this.createAgentSecretKey();
    const keyHash = this.sha256(secretKey);
    const keyPrefix = this.getAgentKeyPrefix(secretKey);

    const { error: keyError } = await supabase.from('agent_keys').insert({
      user_id: user.id,
      name: dto.keyName || 'default',
      key_hash: keyHash,
      key_prefix: keyPrefix,
      created_at: new Date().toISOString(),
    });

    if (keyError) {
      await supabase.from('users').delete().eq('id', user.id);
      throw new BadRequestException(`Failed to store agent key: ${keyError.message}`);
    }

    await this.audit('agent.register', { username, keyPrefix }, user.id);

    return {
      success: true,
      data: {
        token: this.issueJwt(user),
        user: this.toUserResponse(user),
        secretKey,
      },
      message: 'Agent account created. Secret key is shown once only.',
    };
  }

  async loginAgent(
    dto: AgentLoginDto
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    const supabase = this.supabaseService.getAdminClient();
    const secretKey = dto.secretKey?.trim();

    if (!secretKey?.startsWith('gi_ask_')) {
      throw new UnauthorizedException('Invalid agent secret key');
    }

    const keyPrefix = this.getAgentKeyPrefix(secretKey);
    this.assertAgentThrottle(keyPrefix);

    const { data: keys, error: keyFindErr } = await supabase
      .from('agent_keys')
      .select('id, user_id, key_hash, revoked_at')
      .eq('key_prefix', keyPrefix)
      .is('revoked_at', null)
      .limit(20);

    if (keyFindErr || !keys?.length) {
      await this.audit('agent.login_failed', { keyPrefix, reason: 'not_found' });
      throw new UnauthorizedException('Invalid agent secret key');
    }

    const incomingHash = this.sha256(secretKey);
    const matched = keys.find((k: any) => {
      const a = Buffer.from(k.key_hash);
      const b = Buffer.from(incomingHash);
      return a.length === b.length && timingSafeEqual(a, b);
    });

    if (!matched) {
      await this.audit('agent.login_failed', { keyPrefix, reason: 'hash_mismatch' });
      throw new UnauthorizedException('Invalid agent secret key');
    }

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', matched.user_id)
      .single();

    if (userErr || !user) {
      throw new UnauthorizedException('User not found');
    }

    await supabase.from('agent_keys').update({ last_used_at: new Date().toISOString() }).eq('id', matched.id);
    await supabase
      .from('users')
      .update({
        login_count: (user.login_count || 0) + 1,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    await this.audit('agent.login_success', { keyPrefix }, user.id);

    return {
      success: true,
      data: {
        token: this.issueJwt({ ...user, login_count: (user.login_count || 0) + 1, last_login_at: new Date().toISOString() }),
        user: this.toUserResponse({ ...user, login_count: (user.login_count || 0) + 1, last_login_at: new Date().toISOString() }),
      },
      message: 'Agent login successful',
    };
  }

  async rotateAgentKey(
    userId: string,
    dto: AgentRotateKeyDto
  ): Promise<ApiResponse<{ secretKey: string }>> {
    const supabase = this.supabaseService.getAdminClient();
    const currentHash = this.sha256(dto.currentSecretKey.trim());

    const { data: activeKey, error: findErr } = await supabase
      .from('agent_keys')
      .select('id, key_hash')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .limit(50);

    if (findErr || !activeKey?.length) {
      throw new UnauthorizedException('No active key found');
    }

    const matched = activeKey.find((k: any) => {
      const a = Buffer.from(k.key_hash);
      const b = Buffer.from(currentHash);
      return a.length === b.length && timingSafeEqual(a, b);
    });

    if (!matched) {
      throw new UnauthorizedException('Current secret key is invalid');
    }

    await supabase.from('agent_keys').update({ revoked_at: new Date().toISOString() }).eq('id', matched.id);

    const newSecret = this.createAgentSecretKey();
    await supabase.from('agent_keys').insert({
      user_id: userId,
      name: dto.newKeyName || 'rotated',
      key_hash: this.sha256(newSecret),
      key_prefix: this.getAgentKeyPrefix(newSecret),
      created_at: new Date().toISOString(),
    });

    await this.audit('agent.rotate_key', { previousKeyId: matched.id }, userId);

    return {
      success: true,
      data: { secretKey: newSecret },
      message: 'Agent key rotated. Save the new key now; it will not be shown again.',
    };
  }

  async revokeAgentKey(
    userId: string,
    dto: AgentRevokeKeyDto
  ): Promise<ApiResponse<{ revoked: boolean }>> {
    const supabase = this.supabaseService.getAdminClient();
    const hash = this.sha256(dto.secretKey.trim());

    const { data: keys, error } = await supabase
      .from('agent_keys')
      .select('id, key_hash')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .limit(50);

    if (error || !keys?.length) {
      throw new UnauthorizedException('No active key found');
    }

    const matched = keys.find((k: any) => {
      const a = Buffer.from(k.key_hash);
      const b = Buffer.from(hash);
      return a.length === b.length && timingSafeEqual(a, b);
    });

    if (!matched) {
      throw new UnauthorizedException('Secret key is invalid');
    }

    await supabase.from('agent_keys').update({ revoked_at: new Date().toISOString() }).eq('id', matched.id);
    await this.audit('agent.revoke_key', { keyId: matched.id }, userId);

    return {
      success: true,
      data: { revoked: true },
      message: 'Agent key revoked',
    };
  }

  async listAgentKeys(
    userId: string
  ): Promise<
    ApiResponse<{
      keys: Array<{
        id: string;
        name: string;
        keyPrefix: string;
        lastUsedAt?: string | null;
        revokedAt?: string | null;
        createdAt: string;
        isActive: boolean;
      }>;
    }>
  > {
    const supabase = this.supabaseService.getAdminClient();
    const { data, error } = await supabase
      .from('agent_keys')
      .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list agent keys: ${error.message}`);
    }

    return {
      success: true,
      data: {
        keys: (data || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          keyPrefix: row.key_prefix,
          lastUsedAt: row.last_used_at,
          revokedAt: row.revoked_at,
          createdAt: row.created_at,
          isActive: !row.revoked_at,
        })),
      },
      message: 'Agent keys loaded',
    };
  }

  /**
   * Link wallet to user account
   */
  async linkWallet(
    userId: string,
    linkWalletDto: LinkWalletDto
  ): Promise<ApiResponse<{ user: User; merged: boolean }>> {
    const { walletAddress, signature, message, signedPayload, isPasskey } =
      linkWalletDto;

    // 1. Verify signature based on wallet type
    let isValid = false;

    if (isPasskey && signedPayload) {
      // Passkey wallet (LazorKit) - uses P256/WebAuthn
      isValid = this.solanaService.verifyPasskeySignature(
        signedPayload,
        signature,
        message
      );
    } else {
      // Regular Solana wallet - uses Ed25519
      isValid = this.solanaService.verifySignature(
        walletAddress,
        signature,
        message
      );
    }

    if (!isValid) {
      throw new UnauthorizedException("Invalid wallet signature");
    }

    const supabase = this.supabaseService.getAdminClient();

    // 2. Use the database function to link wallet
    const { data: result, error: rpcError } = await supabase.rpc(
      "link_wallet_to_user",
      {
        p_user_id: userId,
        p_wallet_address: walletAddress,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      throw new Error(`Failed to link wallet: ${rpcError.message}`);
    }

    const { success, message: resultMessage, merged_from_wallet } = result[0];

    if (!success) {
      throw new Error(resultMessage);
    }

    // 3. Fetch updated user data
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      throw new Error("Failed to fetch updated user data");
    }

    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider,
      authId: user.auth_id,
      needsWalletConnect: false,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: {
        user: userResponse,
        merged: merged_from_wallet,
      },
      message: resultMessage,
    };
  }

  /**
   * Optional email enrichment for wallet-first login.
   */
  async updateWalletEmail(
    userId: string,
    dto: UpdateWalletEmailDto
  ): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();
    const email = (dto.email || '').trim().toLowerCase();

    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !currentUser) {
      throw new UnauthorizedException('User not found');
    }

    // Optional means user can skip for now
    if (!email) {
      const userResponse: User = {
        id: currentUser.id,
        wallet: currentUser.wallet,
        username: currentUser.username,
        bio: currentUser.bio,
        avatar: currentUser.avatar,
        coverImage: currentUser.cover_image,
        reputationScore: currentUser.reputation_score || 0,
        socialLinks: currentUser.social_links,
        lastLoginAt: currentUser.last_login_at,
        loginCount: currentUser.login_count || 0,
        createdAt: currentUser.created_at,
        email: currentUser.email,
        authProvider: currentUser.auth_provider || 'wallet',
        authId: currentUser.auth_id,
        needsWalletConnect: currentUser.needs_wallet_connect || false,
        followersCount: currentUser.followers_count || 0,
        followingCount: currentUser.following_count || 0,
      };

      return {
        success: true,
        data: userResponse,
        message: 'Skipped email update',
      };
    }

    const { data: emailTaken } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();

    if (emailTaken) {
      throw new BadRequestException('Email is already used by another account');
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email,
        auth_provider: currentUser.auth_provider || 'wallet',
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError || !updatedUser) {
      throw new Error(`Failed to update email: ${updateError?.message || 'Unknown error'}`);
    }

    const userResponse: User = {
      id: updatedUser.id,
      wallet: updatedUser.wallet,
      username: updatedUser.username,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      coverImage: updatedUser.cover_image,
      reputationScore: updatedUser.reputation_score || 0,
      socialLinks: updatedUser.social_links,
      lastLoginAt: updatedUser.last_login_at,
      loginCount: updatedUser.login_count || 0,
      createdAt: updatedUser.created_at,
      email: updatedUser.email,
      authProvider: updatedUser.auth_provider || 'wallet',
      authId: updatedUser.auth_id,
      needsWalletConnect: updatedUser.needs_wallet_connect || false,
      followersCount: updatedUser.followers_count || 0,
      followingCount: updatedUser.following_count || 0,
    };

    return {
      success: true,
      data: userResponse,
      message: 'Email updated successfully',
    };
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(userId: string): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException("User not found");
    }

    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider || "wallet",
      authId: user.auth_id,
      needsWalletConnect: user.needs_wallet_connect || false,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: userResponse,
    };
  }

  /**
   * Check if a wallet is already linked to an account
   */
  async checkWalletExists(
    walletAddress: string
  ): Promise<ApiResponse<{ exists: boolean; userId?: string }>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("wallet", walletAddress)
      .single();

    if (error || !user) {
      return {
        success: true,
        data: { exists: false },
      };
    }

    return {
      success: true,
      data: { exists: true, userId: user.id },
    };
  }
}
